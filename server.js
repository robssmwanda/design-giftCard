import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { iconSvg } from './lib/icons.js';
import { getCatalogAndFeatured, getCatalog } from './lib/catalogController.js';
import {
  getPawapayConfig,
  getPawapayProviders,
  createOrderFromCart,
  initiateStripePayment,
  initiatePawapayPayment,
  checkPaymentStatus,
  handleStripeWebhook,
  handlePawapayWebhook,
  getStripePublishableKey,
} from './lib/paymentController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Stripe webhook must receive the raw body for signature verification.
// Register it BEFORE the global JSON parser so it gets the untouched buffer.
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Make icon helper + format functions available to all EJS templates
app.use((req, res, next) => {
  res.locals.icon = iconSvg;
  res.locals.formatCurrency = (v) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(Number(v));
  res.locals.discountPercent = (denom, price) => {
    if (denom <= 0) return 0;
    return Math.round((1 - price / denom) * 100);
  };
  next();
});

// ── Routes ──────────────────────────────────────────────

app.get('/', async (req, res) => {
  const { catalog, featured } = await getCatalogAndFeatured();
  res.render('index', { catalog, featured });
});

// API: get all brands + gift cards (for client-side filtering)
app.get('/api/catalog', async (req, res) => {
  const catalog = await getCatalog();
  res.json({ catalog });
});

// ── Auth pages (frontend only — backend wiring comes later) ──

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/forgot-password', (req, res) => {
  res.render('forgot-password');
});

app.get('/cart', (req, res) => {
  res.render('cart');
});

// ── Payment pages ──

app.get('/payment/success', (req, res) => {
  res.render('payment-success', { orderId: req.query.order || '' });
});

app.get('/payment/cancel', (req, res) => {
  res.render('payment-cancel', { orderId: req.query.order || '' });
});

// ── Payment API ──

// Stripe publishable key (safe to expose)
app.get('/api/payments/stripe/config', getStripePublishableKey);

// PawaPay active configuration (countries)
app.get('/api/payments/pawapay/config', getPawapayConfig);

// PawaPay providers for a country
app.get('/api/payments/pawapay/providers', getPawapayProviders);

// Create order from cart
app.post('/api/payments/order', createOrderFromCart);

// Initiate Stripe payment
app.post('/api/payments/stripe/checkout', initiateStripePayment);

// Initiate PawaPay mobile money payment
app.post('/api/payments/pawapay/deposit', initiatePawapayPayment);

// Check payment status (polling)
app.get('/api/payments/status/:paymentId', checkPaymentStatus);

// ── PawaPay webhook ──

app.post('/webhooks/pawapay', handlePawapayWebhook);

app.listen(PORT, () => {
  console.log(`Kadopay running at http://localhost:${PORT}`);
});
