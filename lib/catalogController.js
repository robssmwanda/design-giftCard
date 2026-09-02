import { connectDB, mongoose } from './mongodb.js';
import GiftCardCategory from '../src/models/GiftCardCategory.js';
import GiftCardOffer from '../src/models/GiftCardOffer.js';

// Deterministic accent color pairs so each brand gets a stable gradient
const ACCENT_PALETTE = [
  ['#FF9900', '#232F3E'],
  ['#E50914', '#221F1F'],
  ['#00704A', '#1E3932'],
  ['#003791', '#0070D1'],
  ['#1B2838', '#66C0F4'],
  ['#1DB954', '#191414'],
  ['#FF5A5F', '#00A699'],
  ['#CC0000', '#E50000'],
  ['#4285F4', '#34A853'],
  ['#107C10', '#0B6A0B'],
  ['#113CCF', '#0072CE'],
  ['#00665E', '#008080'],
  ['#0046BE', '#FFF200'],
  ['#003580', '#FFB800'],
  ['#720E1E', '#A8162E'],
  ['#E50010', '#222222'],
  ['#E60012', '#000000'],
  ['#E53238', '#0064D2'],
  ['#FF3008', '#FFB800'],
  ['#A8A8A8', '#1D1D1F'],
  ['#111111', '#FF6900'],
  ['#000000', '#1FBAD6'],
  ['#0F172A', '#334155'],
  ['#1E40AF', '#3B82F6'],
];

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pickAccent(index) {
  return ACCENT_PALETTE[index % ACCENT_PALETTE.length];
}

function inferCategory(name, region) {
  const n = (name || '').toLowerCase();
  if (/(netflix|spotify|disney|apple|google|youtube|hulu|hbo)/.test(n)) return 'Entertainment';
  if (/(amazon|target|ebay|best buy|walmart|costco)/.test(n)) return 'Shopping';
  if (/(starbucks|chipotle|doordash|whole foods|dominos|mcdonald|subway|grubhub)/.test(n)) return 'Food & Drink';
  if (/(playstation|xbox|steam|nintendo|roblox|fortnite|riot|game)/.test(n)) return 'Gaming';
  if (/(uber|airbnb|booking|hotel|flight|travel|delta|united|marriott)/.test(n)) return 'Travel';
  if (/(nike|adidas|sephora|h&m|hm|zara|fashion|apparel|gucci|louis)/.test(n)) return 'Fashion';
  return 'Shopping';
}

/**
 * Fetches the full catalog from MongoDB (categories + offers) and maps it
 * to the shape the EJS templates expect: an array of brand objects, each
 * with a `gift_cards` array of denomination/price objects.
 *
 * MongoDB schema:
 *   GiftCardCategory: { categoryId, name, region, image, updatedAt }
 *   GiftCardOffer:    { categoryId, cardId, categoryName, name, priceUsd, stock, ... }
 *
 * EJS expects:
 *   brand: { id, name, slug, category, description, accent_color, accent_color_2,
 *            is_featured, popularity, region, gift_cards: [{ id, denomination, price, is_active }] }
 */
export async function getCatalog() {
  await connectDB();

  if (mongoose.connection.readyState !== 1) {
    return [];
  }

  try {
    const [categories, offers] = await Promise.all([
      GiftCardCategory.find().lean().sort({ name: 1 }),
      GiftCardOffer.find().lean().sort({ priceUsd: 1 }),
    ]);

    // Group offers by categoryId
    const offersByCategory = {};
    for (const offer of offers) {
      if (!offersByCategory[offer.categoryId]) offersByCategory[offer.categoryId] = [];
      offersByCategory[offer.categoryId].push(offer);
    }

    const catalog = categories.map((cat, index) => {
      const categoryOffers = offersByCategory[cat.categoryId] || [];
      const [accent, accent2] = pickAccent(index);

      const giftCards = categoryOffers.map((offer) => ({
        id: offer.cardId,
        denomination: offer.priceUsd,
        price: offer.priceUsd,
        is_active: offer.stock > 0,
        stock: offer.stock,
        minOrderQuantity: offer.minOrderQuantity,
        maxOrderQuantity: offer.maxOrderQuantity,
        note: offer.note,
      }));

      return {
        id: cat.categoryId,
        name: cat.name,
        slug: slugify(cat.name),
        category: inferCategory(cat.name, cat.region),
        description: cat.region ? `Gift cards for ${cat.name} (${cat.region})` : `Premium digital gift card for ${cat.name}.`,
        image_url: cat.image || '',
        accent_color: accent,
        accent_color_2: accent2,
        is_featured: index < 8,
        popularity: 100 - index,
        region: cat.region || '',
        gift_cards: giftCards,
      };
    });

    // Filter out brands with no offers
    return catalog.filter((b) => b.gift_cards.length > 0);
  } catch (err) {
    console.error('[Catalog] Error fetching catalog:', err.message);
    return [];
  }
}

/**
 * Returns the catalog plus a featured subset (first 8 brands).
 */
export async function getCatalogAndFeatured() {
  const catalog = await getCatalog();
  const featured = catalog.filter((b) => b.is_featured).slice(0, 8);
  return { catalog, featured };
}
