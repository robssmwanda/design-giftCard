/*
# Kadopay Gift Card Marketplace — Catalog Schema

Creates the brand and gift card catalog tables for the Kadopay marketplace.
This is a single-tenant, no-auth app: the catalog is public/shared data that
the anon-key frontend reads freely. There is no user account system, so all
policies target `anon, authenticated`.

## 1. New Tables

### `brands`
Stores a gift card brand/merchant (e.g. Amazon, Netflix, Starbucks).
- `id` uuid PK
- `name` text, not null — display name
- `slug` text, unique, not null — URL-safe identifier
- `category` text, not null — one of: Entertainment, Shopping, Food & Drink, Gaming, Travel, Fashion
- `description` text — short marketing blurb
- `image_url` text — brand artwork / logo URL
- `accent_color` text — hex color used for the card gradient
- `accent_color_2` text — secondary hex for gradient
- `is_featured` boolean default false — shown in featured carousel
- `popularity` int default 0 — sort weight for "popular" ordering
- `created_at` timestamptz default now()

### `gift_cards`
A purchasable denomination of a brand's gift card.
- `id` uuid PK
- `brand_id` uuid FK → brands(id) ON DELETE CASCADE
- `denomination` numeric(10,2) not null — face value in USD
- `price` numeric(10,2) not null — actual sale price (may be discounted)
- `is_active` boolean default true
- `created_at` timestamptz default now()
- Unique constraint on (brand_id, denomination)

## 2. Security
- RLS enabled on both tables.
- Both are intentionally public catalog data (no auth), so SELECT is open to
  `anon, authenticated`. No INSERT/UPDATE/DELETE policies are created — the
  catalog is managed server-side, not from the browser.

## 3. Seed Data
- 24 brands across 6 categories with artwork URLs, accent colors, and descriptions.
- 4–6 denomination rows per brand (roughly 120 gift_cards rows total).
*/

-- ── brands ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brands (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text UNIQUE NOT NULL,
  category      text NOT NULL,
  description   text,
  image_url     text,
  accent_color  text,
  accent_color_2 text,
  is_featured   boolean NOT NULL DEFAULT false,
  popularity    int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_brands" ON brands;
CREATE POLICY "anon_read_brands" ON brands FOR SELECT
  TO anon, authenticated USING (true);

-- ── gift_cards ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gift_cards (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id     uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  denomination numeric(10,2) NOT NULL,
  price        numeric(10,2) NOT NULL,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, denomination)
);

ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_gift_cards" ON gift_cards;
CREATE POLICY "anon_read_gift_cards" ON gift_cards FOR SELECT
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_gift_cards_brand_id ON gift_cards(brand_id);

-- ── seed: brands ───────────────────────────────────────
INSERT INTO brands (name, slug, category, description, image_url, accent_color, accent_color_2, is_featured, popularity) VALUES
('Amazon',     'amazon',     'Shopping',      'The everything store. Use for millions of products across every category.', 'https://images.pexels.com/photos/2305098/pexels-photo-2305098.jpeg', '#FF9900', '#232F3E', true, 100),
('Netflix',    'netflix',    'Entertainment', 'Stream award-winning movies, shows, and documentaries ad-free.', 'https://images.pexels.com/photos/3062519/pexels-photo-3062519.jpeg', '#E50914', '#221F1F', true, 95),
('Starbucks',  'starbucks',  'Food & Drink',  'Your daily ritual. Coffee, pastries, and more at 30,000+ locations.', 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg', '#00704A', '#1E3932', true, 92),
('Apple',      'apple',      'Entertainment', 'Spend on apps, music, movies, iCloud, and more across the Apple ecosystem.', 'https://images.pexels.com/photos/265152/pexels-photo-265152.jpeg', '#A8A8A8', '#1D1D1F', true, 90),
('PlayStation','playstation', 'Gaming',       'Top up your wallet for games, add-ons, and PS Plus subscriptions.', 'https://images.pexels.com/photos/15406577/pexels-photo-15406577.jpeg', '#003791', '#0070D1', true, 88),
('Nike',       'nike',       'Fashion',       'Gear up with performance and lifestyle footwear and apparel.', 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg', '#111111', '#FF6900', true, 85),
('Spotify',    'spotify',    'Entertainment', 'Ad-free music, podcasts, and personalized playlists on every device.', 'https://images.pexels.com/photos/1370545/pexels-photo-1370545.jpeg', '#1DB954', '#191414', false, 80),
('Uber',       'uber',       'Travel',        'Rides and Eats in one balance. Get where you need to go or eat well.', 'https://images.pexels.com/photos/934382/pexels-photo-934382.jpeg', '#000000', '#1FBAD6', false, 78),
('Steam',      'steam',      'Gaming',        'The ultimate destination for PC gaming — thousands of titles and deals.', 'https://images.pexels.com/photos/442559/pexels-photo-442559.jpeg', '#1B2838', '#66C0F4', false, 82),
('Airbnb',     'airbnb',     'Travel',        'Book unique stays and experiences around the world.', 'https://images.pexels.com/photos/2029722/pexels-photo-2029722.jpeg', '#FF5A5F', '#00A699', false, 75),
('Target',     'target',     'Shopping',      'Expect more, pay less. Shop home, electronics, groceries, and style.', 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg', '#CC0000', '#E50000', false, 70),
('Google Play','google-play','Entertainment', 'Apps, games, movies, and books for your Android devices.', 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg', '#4285F4', '#34A853', false, 68),
('Adidas',     'adidas',     'Fashion',       'Sportswear and streetwear engineered for athletes and creators.', 'https://images.pexels.com/photos/2529147/pexels-photo-2529147.jpeg', '#000000', '#FFFFFF', false, 65),
('DoorDash',   'doordash',   'Food & Drink',  'Delivery from your favorite local restaurants, groceries, and more.', 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg', '#FF3008', '#FFB800', false, 72),
('Xbox',       'xbox',       'Gaming',        'Games, Game Pass, and entertainment for your Xbox console.', 'https://images.pexels.com/photos/15406577/pexels-photo-15406577.jpeg', '#107C10', '#0B6A0B', false, 77),
('Sephora',    'sephora',    'Fashion',       'Beauty, skincare, and fragrance from the brands you love.', 'https://images.pexels.com/photos/2536965/pexels-photo-2536965.jpeg', '#000000', '#FF0000', false, 60),
('Disney',     'disney',     'Entertainment', 'Movies, shows, and park magic for the whole family.', 'https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg', '#113CCF', '#0072CE', false, 58),
('Whole Foods', 'whole-foods','Food & Drink',  'Organic, natural, and high-quality groceries for healthy living.', 'https://images.pexels.com/photos/264637/pexels-photo-264637.jpeg', '#00665E', '#008080', false, 55),
('Best Buy',   'best-buy',   'Shopping',      'Electronics, appliances, and tech from the brands you trust.', 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg', '#0046BE', '#FFF200', false, 62),
('Booking.com','booking',    'Travel',        'Hotels, flights, and car rentals for your next adventure.', 'https://images.pexels.com/photos/2026324/pexels-photo-2026324.jpeg', '#003580', '#FFB800', false, 57),
('Chipotle',   'chipotle',   'Food & Drink',  'Fresh burritos, bowls, and lifestyle bowls made to order.', 'https://images.pexels.com/photos/5848478/pexels-photo-5848478.jpeg', '#720E1E', '#A8162E', false, 50),
('H&M',        'hm',         'Fashion',       'Fashion and quality at the best price in a sustainable way.', 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg', '#E50010', '#222222', false, 48),
('Nintendo',  'nintendo',    'Gaming',        'Games and content for your Nintendo Switch console.', 'https://images.pexels.com/photos/15406577/pexels-photo-15406577.jpeg', '#E60012', '#000000', false, 66),
('eBay',      'ebay',        'Shopping',      'Find deals on electronics, fashion, collectibles, and more.', 'https://images.pexels.com/photos/421965/pexels-photo-421965.jpeg', '#E53238', '#0064D2', false, 45)
ON CONFLICT (slug) DO NOTHING;

-- ── seed: gift_cards (denominations) ───────────────────
-- Generate 4-6 denominations per brand at common price points.
INSERT INTO gift_cards (brand_id, denomination, price)
SELECT b.id, v.denom, v.price
FROM brands b
JOIN (
  VALUES
    ('amazon',      25.00, 25.00), ('amazon',      50.00, 48.50), ('amazon',     100.00, 96.00), ('amazon',     200.00, 190.00), ('amazon',     500.00, 475.00),
    ('netflix',     25.00, 25.00), ('netflix',     50.00, 49.00), ('netflix',    100.00, 97.00), ('netflix',    200.00, 193.00),
    ('starbucks',   10.00, 10.00), ('starbucks',   25.00, 24.00), ('starbucks',  50.00, 48.00), ('starbucks',  100.00, 95.00),
    ('apple',       25.00, 25.00), ('apple',       50.00, 49.00), ('apple',     100.00, 98.00), ('apple',     200.00, 196.00),
    ('playstation', 10.00, 10.00), ('playstation', 25.00, 24.50), ('playstation',50.00, 49.00), ('playstation',100.00, 97.00), ('playstation',200.00, 194.00),
    ('nike',        25.00, 25.00), ('nike',        50.00, 48.00), ('nike',      100.00, 95.00), ('nike',      200.00, 190.00),
    ('spotify',     30.00, 30.00), ('spotify',     60.00, 58.00), ('spotify',    99.00, 95.00),
    ('uber',        25.00, 25.00), ('uber',        50.00, 48.50), ('uber',      100.00, 96.00), ('uber',      200.00, 192.00),
    ('steam',       20.00, 20.00), ('steam',       50.00, 48.00), ('steam',     100.00, 95.00), ('steam',     200.00, 190.00),
    ('airbnb',      50.00, 50.00), ('airbnb',     100.00, 97.00), ('airbnb',    200.00, 193.00), ('airbnb',    500.00, 480.00),
    ('target',      25.00, 25.00), ('target',      50.00, 48.00), ('target',    100.00, 95.00), ('target',    200.00, 190.00),
    ('google-play', 10.00, 10.00), ('google-play', 25.00, 24.00), ('google-play',50.00, 48.00), ('google-play',100.00, 95.00),
    ('adidas',      25.00, 25.00), ('adidas',      50.00, 48.00), ('adidas',    100.00, 95.00), ('adidas',    200.00, 190.00),
    ('doordash',    25.00, 25.00), ('doordash',    50.00, 48.50), ('doordash',  100.00, 96.00), ('doordash',  200.00, 192.00),
    ('xbox',        15.00, 15.00), ('xbox',        25.00, 24.50), ('xbox',      50.00, 49.00), ('xbox',      100.00, 97.00),
    ('sephora',     25.00, 25.00), ('sephora',     50.00, 48.00), ('sephora',  100.00, 96.00), ('sephora',  250.00, 240.00),
    ('disney',      25.00, 25.00), ('disney',      50.00, 49.00), ('disney',    100.00, 97.00), ('disney',    200.00, 194.00),
    ('whole-foods', 25.00, 25.00), ('whole-foods', 50.00, 48.00), ('whole-foods',100.00, 95.00), ('whole-foods',200.00, 190.00),
    ('best-buy',    25.00, 25.00), ('best-buy',    50.00, 48.00), ('best-buy',  100.00, 95.00), ('best-buy',  200.00, 190.00), ('best-buy',  500.00, 475.00),
    ('booking',     50.00, 50.00), ('booking',    100.00, 97.00), ('booking',  200.00, 193.00), ('booking',  500.00, 480.00),
    ('chipotle',    10.00, 10.00), ('chipotle',    25.00, 24.00), ('chipotle',  50.00, 48.00), ('chipotle',  100.00, 95.00),
    ('hm',          25.00, 25.00), ('hm',          50.00, 48.00), ('hm',       100.00, 95.00),
    ('nintendo',    20.00, 20.00), ('nintendo',    35.00, 34.00), ('nintendo',  50.00, 48.00), ('nintendo',  70.00, 67.00),
    ('ebay',        25.00, 25.00), ('ebay',        50.00, 48.00), ('ebay',     100.00, 95.00), ('ebay',     200.00, 190.00)
) AS v(slug, denom, price)
ON v.slug = b.slug
ON CONFLICT (brand_id, denomination) DO NOTHING;
