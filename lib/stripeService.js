import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

let stripeClient = null;

function getStripe() {
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export async function createCheckoutSession(params) {
  const {
    orderId,
    amount,
    currency,
    customerEmail,
    successUrl,
    cancelUrl,
    metadata,
  } = params;

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: (currency || 'usd').toLowerCase(),
          product_data: {
            name: 'Kadopay Gift Cards',
            description: `Order ${orderId}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    customer_email: customerEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      orderId,
      ...metadata,
    },
  });

  return {
    sessionId: session.id,
    url: session.url,
    paymentIntent: session.payment_intent,
  };
}

export async function retrieveCheckoutSession(sessionId) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session;
}

export async function retrievePaymentIntent(paymentIntentId) {
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return intent;
}

export function mapStripeStatus(stripeStatus) {
  const s = String(stripeStatus || '').toLowerCase();
  if (s === 'paid' || s === 'complete' || s === 'succeeded') return 'paid';
  if (s === 'failed' || s === 'unpaid') return 'failed';
  if (s === 'canceled' || s === 'cancelled') return 'cancelled';
  if (s === 'processing' || s === 'requires_action') return 'processing';
  return 'pending';
}

export function verifyWebhookSignature(rawBody, signature) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}
