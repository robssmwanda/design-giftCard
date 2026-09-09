import { randomUUID } from 'node:crypto';
import { connectDB } from './mongodb.js';
import Order from '../src/models/Order.js';
import Payment from '../src/models/Payment.js';
import { processDelivery } from './deliveryService.js';
import {
  getActiveConfiguration,
  extractCountries,
  extractProvidersForCountry,
  createDeposit,
  getDepositStatus,
  mapDepositStatus,
  generateDepositId,
} from './pawapayService.js';
import {
  createCheckoutSession,
  retrieveCheckoutSession,
  mapStripeStatus,
} from './stripeService.js';

function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomUUID().slice(0, 6).toUpperCase();
  return `KDP-${ts}-${rand}`;
}

function generatePaymentId() {
  return `PAY-${randomUUID()}`;
}

function validateCartItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, error: 'Cart is empty' };
  }
  for (const item of items) {
    if (!item.giftCardId || !item.brandName || !item.deliveryEmail) {
      return { valid: false, error: 'Missing required item fields' };
    }
    if (typeof item.price !== 'number' || item.price <= 0) {
      return { valid: false, error: 'Invalid item price' };
    }
    if (typeof item.quantity !== 'number' || item.quantity < 1) {
      return { valid: false, error: 'Invalid item quantity' };
    }
  }
  return { valid: true };
}

function calculateTotal(items) {
  return Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;
}

async function createOrder(items, customerEmail, userId) {
  await connectDB();
  const total = calculateTotal(items);
  const orderId = generateOrderId();

  const order = new Order({
    orderId,
    userId: userId || null,
    customerEmail,
    items: items.map((i) => ({
      giftCardId: i.giftCardId,
      brandId: i.brandId || '',
      brandName: i.brandName,
      brandSlug: i.brandSlug || '',
      denomination: i.denomination,
      price: i.price,
      quantity: i.quantity,
      deliveryEmail: i.deliveryEmail,
      accentColor: i.accentColor || '#0F172A',
      accentColor2: i.accentColor2 || '#334155',
    })),
    totalAmount: total,
    currency: 'USD',
    status: 'pending',
  });

  await order.save();
  return order;
}

async function createPaymentRecord(order, provider, method, extra) {
  const paymentId = generatePaymentId();
  const payment = new Payment({
    paymentId,
    orderId: order.orderId,
    orderRef: order._id,
    userId: order.userId,
    customerEmail: order.customerEmail,
    provider,
    method,
    amount: order.totalAmount,
    currency: order.currency,
    status: 'pending',
    providerTransactionId: extra?.providerTransactionId || '',
    providerReference: extra?.providerReference || '',
    metadata: extra?.metadata || {},
  });

  await payment.save();
  order.paymentId = payment._id;
  await order.save();
  return payment;
}

async function markPaymentPaid(payment, providerTransactionId, extra) {
  if (payment.status === 'paid') {
    console.log(`[Payment] ${payment.paymentId} already paid, skipping`);
    return { alreadyPaid: true, payment };
  }

  payment.status = 'paid';
  payment.providerTransactionId = providerTransactionId || payment.providerTransactionId;
  if (extra?.metadata) {
    payment.metadata = { ...payment.metadata, ...extra.metadata };
  }
  await payment.save();
  return { alreadyPaid: false, payment };
}

async function markOrderPaidAndDeliver(order) {
  if (order.status === 'paid' && order.delivered) {
    console.log(`[Order] ${order.orderId} already paid and delivered`);
    return { alreadyDone: true, order };
  }

  order.status = 'paid';
  await order.save();

  const { results } = await processDelivery(order);
  order.delivered = true;
  order.deliveredAt = new Date();
  order.deliveryResults = results;
  await order.save();

  return { alreadyDone: false, order, deliveryResults: results };
}

// ── API Controllers ──

export async function getPawapayConfig(req, res) {
  try {
    const config = await getActiveConfiguration();
    const countries = extractCountries(config);
    res.json({ countries });
  } catch (err) {
    console.error('[API] getPawapayConfig error:', err.message);
    res.status(500).json({ error: 'Unable to fetch payment configuration' });
  }
}

export async function getPawapayProviders(req, res) {
  try {
    const { countryCode } = req.query;
    if (!countryCode) {
      return res.status(400).json({ error: 'countryCode is required' });
    }
    const config = await getActiveConfiguration();
    const providers = extractProvidersForCountry(config, countryCode);
    res.json({ providers });
  } catch (err) {
    console.error('[API] getPawapayProviders error:', err.message);
    res.status(500).json({ error: 'Unable to fetch providers' });
  }
}

export async function createOrderFromCart(req, res) {
  try {
    const { items, customerEmail } = req.body;
    if (!customerEmail || !customerEmail.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    const validation = validateCartItems(items);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const order = await createOrder(items, customerEmail, req.session?.userId || null);
    res.json({ orderId: order.orderId, totalAmount: order.totalAmount, currency: order.currency });
  } catch (err) {
    console.error('[API] createOrder error:', err.message);
    res.status(500).json({ error: 'Unable to create order' });
  }
}

export async function initiateStripePayment(req, res) {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    await connectDB();
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.status === 'paid') {
      return res.status(400).json({ error: 'Order already paid' });
    }

    const existingPayment = await Payment.findOne({ orderId, provider: 'stripe', status: { $in: ['pending', 'processing'] } });
    if (existingPayment) {
      return res.status(400).json({ error: 'A pending Stripe payment already exists for this order' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const session = await createCheckoutSession({
      orderId: order.orderId,
      amount: order.totalAmount,
      currency: order.currency,
      customerEmail: order.customerEmail,
      successUrl: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&order=${order.orderId}`,
      cancelUrl: `${baseUrl}/payment/cancel?order=${order.orderId}`,
      metadata: { orderId: order.orderId },
    });

    const payment = await createPaymentRecord(order, 'stripe', 'card', {
      providerTransactionId: session.sessionId,
      metadata: { stripeSessionId: session.sessionId },
    });

    res.json({ url: session.url, paymentId: payment.paymentId });
  } catch (err) {
    console.error('[API] initiateStripePayment error:', err.message);
    res.status(500).json({ error: 'Unable to initiate card payment' });
  }
}

export async function initiatePawapayPayment(req, res) {
  try {
    const { orderId, country, provider, phoneNumber } = req.body;
    if (!orderId || !country || !provider || !phoneNumber) {
      return res.status(400).json({ error: 'orderId, country, provider, and phoneNumber are required' });
    }

    const phoneRegex = /^\d{8,15}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    await connectDB();
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.status === 'paid') {
      return res.status(400).json({ error: 'Order already paid' });
    }

    const existingPayment = await Payment.findOne({ orderId, provider: 'pawapay', status: { $in: ['pending', 'processing'] } });
    if (existingPayment) {
      return res.status(400).json({ error: 'A pending mobile money payment already exists for this order' });
    }

    const config = await getActiveConfiguration();
    const providers = extractProvidersForCountry(config, country);
    if (!providers.some((p) => p.code === provider)) {
      return res.status(400).json({ error: 'Unsupported provider for this country' });
    }

    const depositId = generateDepositId();
    const depositResult = await createDeposit({
      depositId,
      amount: order.totalAmount,
      currency: order.currency,
      country,
      phoneNumber: phoneNumber.replace(/\s/g, ''),
      provider,
      customerEmail: order.customerEmail,
      orderId: order.orderId,
      customerMessage: 'Kadopay Gift Cards',
    });

    const payment = await createPaymentRecord(order, 'pawapay', 'mobile_money', {
      providerTransactionId: depositId,
      metadata: { depositId, country, provider, phoneNumber: phoneNumber.replace(/\s/g, '') },
    });

    payment.status = 'processing';
    await payment.save();

    res.json({ depositId, paymentId: payment.paymentId, status: 'processing' });
  } catch (err) {
    console.error('[API] initiatePawapayPayment error:', err.message);
    if (err.pawapayData) {
      console.error('[PawaPay] Details:', JSON.stringify(err.pawapayData));
    }
    res.status(500).json({ error: 'Unable to initiate mobile money payment' });
  }
}

export async function checkPaymentStatus(req, res) {
  try {
    const { paymentId } = req.params;
    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId is required' });
    }

    await connectDB();
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.provider === 'pawapay' && (payment.status === 'pending' || payment.status === 'processing')) {
      try {
        const depositStatus = await getDepositStatus(payment.providerTransactionId);
        const mapped = mapDepositStatus(depositStatus?.data?.status || depositStatus?.status);
        if (mapped !== 'pending' && mapped !== 'processing') {
          payment.status = mapped;
          if (mapped === 'failed') {
            payment.failureReason = depositStatus?.data?.failureReason || 'Payment failed';
          }
          await payment.save();

          if (mapped === 'paid') {
            const order = await Order.findOne({ orderId: payment.orderId });
            if (order && order.status !== 'paid') {
              await markOrderPaidAndDeliver(order);
            }
          }
        }
      } catch (pollErr) {
        console.error('[Payment] Polling error:', pollErr.message);
      }
    }

    if (payment.provider === 'stripe' && (payment.status === 'pending' || payment.status === 'processing') && payment.metadata?.stripeSessionId) {
      try {
        const session = await retrieveCheckoutSession(payment.metadata.stripeSessionId);
        const mapped = mapStripeStatus(session.payment_status);
        if (mapped !== 'pending' && mapped !== 'processing') {
          payment.status = mapped;
          await payment.save();

          if (mapped === 'paid') {
            const order = await Order.findOne({ orderId: payment.orderId });
            if (order && order.status !== 'paid') {
              await markOrderPaidAndDeliver(order);
            }
          }
        }
      } catch (pollErr) {
        console.error('[Payment] Stripe polling error:', pollErr.message);
      }
    }

    res.json({
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      status: payment.status,
      provider: payment.provider,
      method: payment.method,
      amount: payment.amount,
      currency: payment.currency,
      failureReason: payment.failureReason,
    });
  } catch (err) {
    console.error('[API] checkPaymentStatus error:', err.message);
    res.status(500).json({ error: 'Unable to check payment status' });
  }
}

export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).send('Missing stripe-signature header');
  }

  let event;
  try {
    const { verifyWebhookSignature } = await import('./stripeService.js');
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
    event = verifyWebhookSignature(rawBody, sig);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await connectDB();

    const eventId = event.id;
    const existingEvent = await Payment.findOne({ 'webhookEvents.eventId': eventId });
    if (existingEvent) {
      console.log(`[Stripe Webhook] Event ${eventId} already processed`);
      return res.json({ received: true, duplicate: true });
    }

    const data = event.data.object;
    const orderId = data.metadata?.orderId || data.metadata?.order_id;

    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
      if (!orderId) {
        console.error('[Stripe Webhook] No orderId in metadata');
        return res.json({ received: true });
      }

      const order = await Order.findOne({ orderId });
      if (!order) {
        console.error(`[Stripe Webhook] Order ${orderId} not found`);
        return res.json({ received: true });
      }

      const providerTxId = data.id || data.payment_intent || '';
      const payment = await Payment.findOne({ orderId, provider: 'stripe' });
      if (payment) {
        const { alreadyPaid } = await markPaymentPaid(payment, providerTxId, {
          metadata: { webhookEventId: eventId },
        });
        payment.webhookReceived = true;
        payment.webhookEvents.push({ eventId, type: event.type, receivedAt: new Date() });
        await payment.save();

        if (!alreadyPaid) {
          await markOrderPaidAndDeliver(order);
        }
      }
    } else if (event.type === 'checkout.session.async_payment_failed' || event.type === 'payment_intent.payment_failed') {
      if (orderId) {
        const payment = await Payment.findOne({ orderId, provider: 'stripe' });
        if (payment) {
          payment.status = 'failed';
          payment.failureReason = data.last_payment_error?.message || 'Payment failed';
          payment.webhookEvents.push({ eventId, type: event.type, receivedAt: new Date() });
          await payment.save();
        }
      }
    } else if (event.type === 'checkout.session.expired') {
      if (orderId) {
        const payment = await Payment.findOne({ orderId, provider: 'stripe' });
        if (payment && payment.status !== 'paid') {
          payment.status = 'expired';
          payment.webhookEvents.push({ eventId, type: event.type, receivedAt: new Date() });
          await payment.save();
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook] Processing error:', err.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

export async function handlePawapayWebhook(req, res) {
  try {
    await connectDB();

    const body = req.body;
    const depositId = body.depositId;
    const status = body.status;

    if (!depositId) {
      return res.status(400).json({ error: 'Missing depositId' });
    }

    const eventId = `pawapay-${depositId}-${status}`;
    const existingEvent = await Payment.findOne({ 'webhookEvents.eventId': eventId });
    if (existingEvent) {
      console.log(`[PawaPay Webhook] Event ${eventId} already processed`);
      return res.json({ received: true, duplicate: true });
    }

    const payment = await Payment.findOne({ providerTransactionId: depositId, provider: 'pawapay' });
    if (!payment) {
      console.error(`[PawaPay Webhook] Payment for deposit ${depositId} not found`);
      return res.json({ received: true });
    }

    const mapped = mapDepositStatus(status);

    if (mapped === 'paid') {
      const { alreadyPaid } = await markPaymentPaid(payment, depositId, {
        metadata: { webhookEventId: eventId },
      });
      payment.webhookReceived = true;
      payment.webhookEvents.push({ eventId, type: status, receivedAt: new Date() });
      await payment.save();

      if (!alreadyPaid) {
        const order = await Order.findOne({ orderId: payment.orderId });
        if (order) {
          await markOrderPaidAndDeliver(order);
        }
      }
    } else if (mapped === 'failed' || mapped === 'cancelled' || mapped === 'expired') {
      payment.status = mapped;
      payment.failureReason = body.failureReason || body.reason || `Payment ${mapped}`;
      payment.webhookEvents.push({ eventId, type: status, receivedAt: new Date() });
      await payment.save();
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[PawaPay Webhook] Processing error:', err.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

export async function getStripePublishableKey(req, res) {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
}
