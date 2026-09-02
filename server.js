import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { iconSvg } from './lib/icons.js';
import { getCatalogAndFeatured, getCatalog } from './lib/catalogController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
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

app.listen(PORT, () => {
  console.log(`Kadopay running at http://localhost:${PORT}`);
});
