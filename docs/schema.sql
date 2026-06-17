-- ============================================================
-- Durian Lens — PostgreSQL Database Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  display_name    VARCHAR(100),
  avatar_url      TEXT,
  role            VARCHAR(20) NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'admin', 'seller', 'farmer')),
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      VARCHAR(255) NOT NULL,
  device_info     JSONB,
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- ============================================================
-- DURIAN VARIETIES
-- ============================================================
CREATE TABLE varieties (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            VARCHAR(50) UNIQUE NOT NULL,  -- 'musang-king', 'd24', 'black-thorn'
  name            VARCHAR(100) NOT NULL,
  scientific_name VARCHAR(150),
  description     TEXT,
  origin          VARCHAR(100),
  season          VARCHAR(100),
  price_range     VARCHAR(50),    -- e.g. 'MYR 25–50/kg'
  thumbnail_url   TEXT,
  banner_url      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VARIETY CHARACTERISTICS
-- ============================================================
CREATE TABLE variety_characteristics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variety_id      UUID NOT NULL REFERENCES varieties(id) ON DELETE CASCADE,
  category        VARCHAR(50) NOT NULL  -- 'flavor', 'texture', 'appearance', 'aroma'
                    CHECK (category IN ('flavor', 'texture', 'appearance', 'aroma', 'nutrition')),
  label           VARCHAR(100) NOT NULL,
  value           TEXT NOT NULL,
  score           SMALLINT CHECK (score BETWEEN 1 AND 10),
  sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_characteristics_variety ON variety_characteristics(variety_id);

-- ============================================================
-- SCANS
-- ============================================================
CREATE TABLE scans (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id          VARCHAR(100),           -- for anonymous scans

  -- Image storage
  image_key           VARCHAR(500) NOT NULL,  -- S3 key
  image_url           TEXT,                   -- CDN URL
  image_size_bytes    INTEGER,
  image_width         INTEGER,
  image_height        INTEGER,

  -- ML Result
  predicted_variety   VARCHAR(50),            -- slug of predicted variety
  variety_id          UUID REFERENCES varieties(id),
  confidence          DECIMAL(5, 4),          -- 0.0000–1.0000
  probabilities       JSONB,                  -- { "musang-king": 0.92, "d24": 0.05, ... }
  confidence_level    VARCHAR(20)             -- 'high', 'medium', 'low'
                        CHECK (confidence_level IN ('high', 'medium', 'low')),

  -- Processing metadata
  processing_ms       INTEGER,
  model_version       VARCHAR(50),

  -- User feedback
  user_feedback       VARCHAR(20)             -- 'correct', 'incorrect', 'unsure'
                        CHECK (user_feedback IN ('correct', 'incorrect', 'unsure')),
  feedback_variety    VARCHAR(50),            -- actual variety if incorrect
  feedback_at         TIMESTAMPTZ,

  -- Source
  source              VARCHAR(20) NOT NULL DEFAULT 'camera'
                        CHECK (source IN ('camera', 'gallery', 'api')),

  -- Location (optional)
  latitude            DECIMAL(9, 6),
  longitude           DECIMAL(9, 6),

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scans_user ON scans(user_id);
CREATE INDEX idx_scans_variety ON scans(predicted_variety);
CREATE INDEX idx_scans_created ON scans(created_at DESC);
CREATE INDEX idx_scans_session ON scans(session_id);

-- ============================================================
-- USER STATS (materialized view / denormalized for performance)
-- ============================================================
CREATE TABLE user_stats (
  user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_scans     INTEGER NOT NULL DEFAULT 0,
  scans_today     INTEGER NOT NULL DEFAULT 0,
  favorite_variety VARCHAR(50),
  accuracy_rate   DECIMAL(5, 4),
  streak_days     INTEGER NOT NULL DEFAULT 0,
  last_scan_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SCAN FEEDBACK / ML IMPROVEMENT
-- ============================================================
CREATE TABLE ml_feedback (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id         UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  predicted       VARCHAR(50) NOT NULL,
  actual          VARCHAR(50),
  confidence      DECIMAL(5, 4),
  notes           TEXT,
  reviewed        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- API KEYS (for B2B / seller integrations)
-- ============================================================
CREATE TABLE api_keys (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  key_hash        VARCHAR(255) NOT NULL,
  key_prefix      VARCHAR(10) NOT NULL,       -- first 8 chars for display
  permissions     TEXT[] NOT NULL DEFAULT '{"scan:read", "scan:create"}',
  rate_limit      INTEGER NOT NULL DEFAULT 1000,  -- requests per day
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- ============================================================
-- SEED: DURIAN VARIETIES
-- ============================================================
INSERT INTO varieties (slug, name, scientific_name, description, origin, season, price_range, sort_order) VALUES
('musang-king', 'D197 Musang King', 'Durio zibethinus cv. D197 Musang King', 'The undisputed King of Durians. Musang King is renowned for its intensely rich, bittersweet flavor with deep golden-yellow flesh. It has a complex taste profile with notes of custard, caramel, and a lingering bitterness that durian connoisseurs prize above all others. Small flat seeds mean an exceptionally high flesh-to-husk ratio.', 'Kelantan and Pahang, Malaysia', 'April – August', 'MYR 25–80/kg', 1),
('black-thorn', 'D200 Black Thorn', 'Durio zibethinus cv. D200 Black Thorn', 'Black Thorn (黑刺) is considered the premium variety that rivals and sometimes surpasses Musang King. Its flesh is pale yellow with a pinkish hue, creamy and velvety in texture, with an extremely complex flavor — sweet, bitter, and deeply fragrant with a distinctly floral finish. Often commands the highest prices at Malaysian durian auctions.', 'Penang, Malaysia', 'June – August', 'MYR 50–120/kg', 2),
('d24', 'D24 Sultan', 'Durio zibethinus cv. D24 Sultan', 'D24 is the classic Malaysian durian and a long-time favorite. Its creamy pale yellow flesh delivers a perfectly balanced sweet-bitter profile, less intense than Musang King but consistently delicious. The affordable price and reliable quality make it the everyday choice for durian lovers across Southeast Asia.', 'Pahang and Johor, Malaysia', 'June – September', 'MYR 10–25/kg', 3),
('red-prawn', 'Red Prawn', 'Durio zibethinus cv. Udang Merah', 'Red Prawn (Udang Merah) is famous for its distinctive soft orange-red flesh, gentle sweetness, and creamy, almost silky texture. A beloved Penang variety with a milder, more approachable finish than the strongest bitter cultivars. The fine-textured flesh melts on the tongue with a delicate floral aftertaste.', 'Penang, Malaysia', 'June – August', 'MYR 15–35/kg', 4),
('tupai-king', 'Tupai King', 'Durio zibethinus cv. Tupai King', 'Tupai King is appreciated for its thick, generous flesh, balanced sweetness, and rich, lingering aroma. Often positioned as a premium Malaysian cultivar for fresh eating, it offers a satisfying mouthfeel with moderately dense texture and a pleasant sweet-bitter interplay.', 'Pahang, Malaysia', 'June – August', 'MYR 20–50/kg', 5),
('golden-phoenix', 'Golden Phoenix', 'Durio zibethinus cv. Golden Phoenix', 'Golden Phoenix is smaller in size but prized for concentrated flavour, pale golden flesh, and a strong bittersweet profile. Small seeds mean more flesh per fruit. One of Singapore''s top favourite varieties, it delivers a surprisingly intense experience for its modest size.', 'Johor, Malaysia', 'May – August', 'MYR 18–40/kg', 6),
('ioi', 'IOI', 'Durio zibethinus cv. IOI', 'IOI is a popular southern Malaysian variety with smooth, golden-yellow flesh, approachable sweetness, and a fragrant profile that suits both new and regular durian eaters. Slightly nutty and grassy notes add subtle complexity to its gentle, milky custard-like texture.', 'Muar, Johor, Malaysia', 'June – September', 'MYR 12–28/kg', 7),
('hor-lor', 'Hor Lor', 'Durio zibethinus cv. Hor Lor', 'Hor Lor, also called gourd durian for its distinctive oval shape, is a Penang favourite with smooth, creamy-sweet flesh. Mild and approachable flavour profile with medium seeds, making it an excellent choice for beginners or those who prefer a gentler durian experience.', 'Penang, Malaysia', 'June – August', 'MYR 10–22/kg', 8),
('dato-nina', 'Dato Nina', 'Durio zibethinus cv. Dato Nina', 'Dato Nina is known for its exceptionally creamy flesh and a rounded sweet-bitter flavour that sits comfortably in the middle of the intensity spectrum. Commonly sought by buyers who prefer a balanced durian profile without overwhelming bitterness or cloying sweetness.', 'Pahang, Malaysia', 'June – August', 'MYR 20–45/kg', 9),
('xo', 'XO', 'Durio zibethinus cv. XO', 'XO is recognised for its fermented, slightly alcoholic aroma reminiscent of aged spirits, and its pronounced bitterness that builds with each bite. A favourite among durian fans who enjoy stronger, more assertive flavours. The pale, watery-looking flesh belies its intense character.', 'Johor and Pahang, Malaysia', 'June – September', 'MYR 15–35/kg', 10),
('tekka', 'Tekka', 'Durio zibethinus cv. Tekka', 'Tekka has thick flesh and a bold sweet-bitter taste with a dense, creamy bite. It is often compared with premium old-tree selections. Harder to cut open due to its fibrous husk, but rewards the patient with an intense, complex taste profile and strong floral notes.', 'Pahang and Johor, Malaysia', 'July – August', 'MYR 20–45/kg', 11),
('green-skin', 'Green Skin', 'Durio zibethinus cv. Green Skin', 'Green Skin is valued for its fragrant, pale yellow flesh and balanced sweetness with minimal bitterness. It is commonly associated with northern Malaysian durian farms and offers a clean, refreshing flavour that appeals to a wide range of palates.', 'Penang, Malaysia', 'June – August', 'MYR 15–30/kg', 12),
('d101', 'D101', 'Durio zibethinus cv. D101', 'D101 offers attractive orange-yellow flesh, medium sweetness, and a pleasant creamy texture. It is popular as a dependable mid-range variety that delivers consistent quality without the premium price tag of the top-tier cultivars.', 'Pahang and Johor, Malaysia', 'June – September', 'MYR 12–28/kg', 13),
('d13', 'D13', 'Durio zibethinus cv. D13', 'D13 is known for its deep orange flesh and a sweeter, lighter flavour with very little bitterness. It is often recommended for people who prefer less bitter durians or are trying the fruit for the first time. The smooth, custardy texture makes it highly approachable.', 'Johor, Malaysia', 'June – September', 'MYR 10–25/kg', 14),
('d88', 'D88', 'Durio zibethinus cv. D88', 'D88 has thick yellow flesh with a rich aroma and moderate bitterness. It is a familiar Malaysian market variety that offers good value for money, with a robust flavour profile that satisfies regular durian eaters looking for a dependable choice.', 'Pahang, Malaysia', 'June – September', 'MYR 12–30/kg', 15),
('d99', 'D99', 'Durio zibethinus cv. D99', 'D99 is an older registered cultivar with a strong fragrance and classic sweet-bitter taste profile. It remains popular in traditional markets for its reliability and well-rounded flavour that captures the essence of classic Malaysian durian.', 'Pahang and Johor, Malaysia', 'June – September', 'MYR 12–28/kg', 16),
('d145-beserah', 'D145 Beserah', 'Durio zibethinus cv. D145 Beserah', 'D145 Beserah is linked with Pahang orchards and is appreciated for aromatic flesh and a traditional kampung durian character. It offers a nostalgic flavour profile that reminds many Malaysians of durians from their childhood.', 'Pahang, Malaysia', 'July – September', 'MYR 12–28/kg', 17),
('d158-kan-yao', 'D158 Kan Yao', 'Durio zibethinus cv. D158 Kan Yao', 'D158 Kan Yao is known for its long-stem shape and a refined flavour profile with creamy, pale yellow flesh. The name translates to "long stem," referencing its distinctive physical appearance. It offers a balanced, elegant eating experience.', 'Pahang, Malaysia', 'June – August', 'MYR 18–40/kg', 18),
('d160', 'D160', 'Durio zibethinus cv. D160', 'D160 is a Malaysian registered cultivar often associated with rich flesh and balanced sweetness. It has gained a loyal following for its consistent quality and pleasant, medium-intensity flavour that works well for everyday enjoyment.', 'Johor, Malaysia', 'June – September', 'MYR 15–32/kg', 19),
('d168', 'D168', 'Durio zibethinus cv. D168', 'D168 is commonly associated with the IOI family of durians, offering creamy flesh and an accessible sweet profile. It provides a smooth, mellow eating experience that makes it a popular choice for casual durian sessions with family and friends.', 'Johor, Malaysia', 'June – September', 'MYR 12–28/kg', 20),
('d175', 'D175', 'Durio zibethinus cv. D175', 'D175 is commonly associated with Red Prawn selections and is loved for its orange-tinged flesh and gentle sweetness. It carries the same silky-smooth texture that makes the Red Prawn family so beloved among Penang durian enthusiasts.', 'Penang, Malaysia', 'June – August', 'MYR 18–40/kg', 21),
('d198-kim-hong', 'D198 Kim Hong', 'Durio zibethinus cv. D198 Kim Hong', 'D198 Kim Hong is a premium cultivar with rich flesh and strong aroma, often discussed alongside modern high-value durians. It offers a luxurious eating experience with complex layers of sweetness and a memorable aftertaste.', 'Pahang, Malaysia', 'June – August', 'MYR 25–55/kg', 22),
('kampung', 'Kampung Durian', 'Durio zibethinus', 'Kampung durians are the wild, village-grown treasures of Malaysia. Flavour, aroma, and texture vary widely by orchard and tree, giving a truly traditional Malaysian durian experience with diverse profiles that can range from mild and sweet to intensely bitter and complex.', 'Throughout Malaysia', 'June – September', 'MYR 8–20/kg', 23);

-- ============================================================
-- SEED: VARIETY CHARACTERISTICS
-- ============================================================
INSERT INTO variety_characteristics (variety_id, category, label, value, score, sort_order)
SELECT v.id, 'flavor', 'Sweetness', '8/10', 8, 1 FROM varieties v WHERE v.slug = 'musang-king'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '7/10', 7, 2 FROM varieties v WHERE v.slug = 'musang-king'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '9/10', 9, 3 FROM varieties v WHERE v.slug = 'musang-king'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '9/10', 9, 4 FROM varieties v WHERE v.slug = 'musang-king'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Deep golden yellow', NULL, 5 FROM varieties v WHERE v.slug = 'musang-king'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '9/10', 9, 1 FROM varieties v WHERE v.slug = 'black-thorn'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '6/10', 6, 2 FROM varieties v WHERE v.slug = 'black-thorn'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '10/10', 10, 3 FROM varieties v WHERE v.slug = 'black-thorn'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '8/10', 8, 4 FROM varieties v WHERE v.slug = 'black-thorn'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Pale yellow with pink hue', NULL, 5 FROM varieties v WHERE v.slug = 'black-thorn'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '7/10', 7, 1 FROM varieties v WHERE v.slug = 'd24'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '6/10', 6, 2 FROM varieties v WHERE v.slug = 'd24'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '7/10', 7, 3 FROM varieties v WHERE v.slug = 'd24'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '7/10', 7, 4 FROM varieties v WHERE v.slug = 'd24'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Creamy pale yellow', NULL, 5 FROM varieties v WHERE v.slug = 'd24'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '8/10', 8, 1 FROM varieties v WHERE v.slug = 'red-prawn'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '3/10', 3, 2 FROM varieties v WHERE v.slug = 'red-prawn'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '8/10', 8, 3 FROM varieties v WHERE v.slug = 'red-prawn'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '6/10', 6, 4 FROM varieties v WHERE v.slug = 'red-prawn'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Pinkish-orange', NULL, 5 FROM varieties v WHERE v.slug = 'red-prawn'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '7/10', 7, 1 FROM varieties v WHERE v.slug = 'tupai-king'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '5/10', 5, 2 FROM varieties v WHERE v.slug = 'tupai-king'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '7/10', 7, 3 FROM varieties v WHERE v.slug = 'tupai-king'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '7/10', 7, 4 FROM varieties v WHERE v.slug = 'tupai-king'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Golden yellow', NULL, 5 FROM varieties v WHERE v.slug = 'tupai-king'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '9/10', 9, 1 FROM varieties v WHERE v.slug = 'golden-phoenix'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '4/10', 4, 2 FROM varieties v WHERE v.slug = 'golden-phoenix'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '7/10', 7, 3 FROM varieties v WHERE v.slug = 'golden-phoenix'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '8/10', 8, 4 FROM varieties v WHERE v.slug = 'golden-phoenix'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Pale golden', NULL, 5 FROM varieties v WHERE v.slug = 'golden-phoenix'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '6/10', 6, 1 FROM varieties v WHERE v.slug = 'ioi'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '2/10', 2, 2 FROM varieties v WHERE v.slug = 'ioi'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '7/10', 7, 3 FROM varieties v WHERE v.slug = 'ioi'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '5/10', 5, 4 FROM varieties v WHERE v.slug = 'ioi'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Golden yellow', NULL, 5 FROM varieties v WHERE v.slug = 'ioi'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '7/10', 7, 1 FROM varieties v WHERE v.slug = 'hor-lor'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '2/10', 2, 2 FROM varieties v WHERE v.slug = 'hor-lor'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '7/10', 7, 3 FROM varieties v WHERE v.slug = 'hor-lor'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '4/10', 4, 4 FROM varieties v WHERE v.slug = 'hor-lor'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Pale cream', NULL, 5 FROM varieties v WHERE v.slug = 'hor-lor'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '7/10', 7, 1 FROM varieties v WHERE v.slug = 'dato-nina'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '5/10', 5, 2 FROM varieties v WHERE v.slug = 'dato-nina'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '8/10', 8, 3 FROM varieties v WHERE v.slug = 'dato-nina'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '6/10', 6, 4 FROM varieties v WHERE v.slug = 'dato-nina'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Pale yellow', NULL, 5 FROM varieties v WHERE v.slug = 'dato-nina'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '5/10', 5, 1 FROM varieties v WHERE v.slug = 'xo'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '8/10', 8, 2 FROM varieties v WHERE v.slug = 'xo'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '6/10', 6, 3 FROM varieties v WHERE v.slug = 'xo'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '9/10', 9, 4 FROM varieties v WHERE v.slug = 'xo'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Pale yellow', NULL, 5 FROM varieties v WHERE v.slug = 'xo'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '6/10', 6, 1 FROM varieties v WHERE v.slug = 'tekka'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '8/10', 8, 2 FROM varieties v WHERE v.slug = 'tekka'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '7/10', 7, 3 FROM varieties v WHERE v.slug = 'tekka'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '9/10', 9, 4 FROM varieties v WHERE v.slug = 'tekka'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Deep yellow', NULL, 5 FROM varieties v WHERE v.slug = 'tekka'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '7/10', 7, 1 FROM varieties v WHERE v.slug = 'green-skin'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '3/10', 3, 2 FROM varieties v WHERE v.slug = 'green-skin'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '6/10', 6, 3 FROM varieties v WHERE v.slug = 'green-skin'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '6/10', 6, 4 FROM varieties v WHERE v.slug = 'green-skin'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Pale yellow', NULL, 5 FROM varieties v WHERE v.slug = 'green-skin'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '6/10', 6, 1 FROM varieties v WHERE v.slug = 'd101'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '4/10', 4, 2 FROM varieties v WHERE v.slug = 'd101'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '6/10', 6, 3 FROM varieties v WHERE v.slug = 'd101'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '5/10', 5, 4 FROM varieties v WHERE v.slug = 'd101'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Orange-yellow', NULL, 5 FROM varieties v WHERE v.slug = 'd101'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '8/10', 8, 1 FROM varieties v WHERE v.slug = 'd13'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '2/10', 2, 2 FROM varieties v WHERE v.slug = 'd13'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '7/10', 7, 3 FROM varieties v WHERE v.slug = 'd13'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '5/10', 5, 4 FROM varieties v WHERE v.slug = 'd13'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Deep orange', NULL, 5 FROM varieties v WHERE v.slug = 'd13'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '6/10', 6, 1 FROM varieties v WHERE v.slug = 'd88'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '6/10', 6, 2 FROM varieties v WHERE v.slug = 'd88'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '7/10', 7, 3 FROM varieties v WHERE v.slug = 'd88'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '7/10', 7, 4 FROM varieties v WHERE v.slug = 'd88'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Bright yellow', NULL, 5 FROM varieties v WHERE v.slug = 'd88'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '7/10', 7, 1 FROM varieties v WHERE v.slug = 'd99'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '6/10', 6, 2 FROM varieties v WHERE v.slug = 'd99'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '6/10', 6, 3 FROM varieties v WHERE v.slug = 'd99'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '7/10', 7, 4 FROM varieties v WHERE v.slug = 'd99'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Yellow', NULL, 5 FROM varieties v WHERE v.slug = 'd99'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '6/10', 6, 1 FROM varieties v WHERE v.slug = 'd145-beserah'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '5/10', 5, 2 FROM varieties v WHERE v.slug = 'd145-beserah'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '6/10', 6, 3 FROM varieties v WHERE v.slug = 'd145-beserah'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '7/10', 7, 4 FROM varieties v WHERE v.slug = 'd145-beserah'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Creamy yellow', NULL, 5 FROM varieties v WHERE v.slug = 'd145-beserah'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '7/10', 7, 1 FROM varieties v WHERE v.slug = 'd158-kan-yao'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '5/10', 5, 2 FROM varieties v WHERE v.slug = 'd158-kan-yao'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '7/10', 7, 3 FROM varieties v WHERE v.slug = 'd158-kan-yao'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '6/10', 6, 4 FROM varieties v WHERE v.slug = 'd158-kan-yao'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Pale yellow', NULL, 5 FROM varieties v WHERE v.slug = 'd158-kan-yao'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '7/10', 7, 1 FROM varieties v WHERE v.slug = 'd160'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '4/10', 4, 2 FROM varieties v WHERE v.slug = 'd160'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '7/10', 7, 3 FROM varieties v WHERE v.slug = 'd160'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '6/10', 6, 4 FROM varieties v WHERE v.slug = 'd160'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Golden yellow', NULL, 5 FROM varieties v WHERE v.slug = 'd160'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '6/10', 6, 1 FROM varieties v WHERE v.slug = 'd168'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '3/10', 3, 2 FROM varieties v WHERE v.slug = 'd168'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '7/10', 7, 3 FROM varieties v WHERE v.slug = 'd168'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '5/10', 5, 4 FROM varieties v WHERE v.slug = 'd168'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Pale yellow', NULL, 5 FROM varieties v WHERE v.slug = 'd168'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '7/10', 7, 1 FROM varieties v WHERE v.slug = 'd175'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '3/10', 3, 2 FROM varieties v WHERE v.slug = 'd175'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '8/10', 8, 3 FROM varieties v WHERE v.slug = 'd175'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '6/10', 6, 4 FROM varieties v WHERE v.slug = 'd175'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Orange-tinged', NULL, 5 FROM varieties v WHERE v.slug = 'd175'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', '8/10', 8, 1 FROM varieties v WHERE v.slug = 'd198-kim-hong'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', '6/10', 6, 2 FROM varieties v WHERE v.slug = 'd198-kim-hong'
UNION ALL SELECT v.id, 'texture', 'Creaminess', '8/10', 8, 3 FROM varieties v WHERE v.slug = 'd198-kim-hong'
UNION ALL SELECT v.id, 'aroma', 'Intensity', '8/10', 8, 4 FROM varieties v WHERE v.slug = 'd198-kim-hong'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Bright yellow', NULL, 5 FROM varieties v WHERE v.slug = 'd198-kim-hong'

UNION ALL SELECT v.id, 'flavor', 'Sweetness', 'Variable', NULL, 1 FROM varieties v WHERE v.slug = 'kampung'
UNION ALL SELECT v.id, 'flavor', 'Bitterness', 'Variable', NULL, 2 FROM varieties v WHERE v.slug = 'kampung'
UNION ALL SELECT v.id, 'texture', 'Creaminess', 'Variable', NULL, 3 FROM varieties v WHERE v.slug = 'kampung'
UNION ALL SELECT v.id, 'aroma', 'Intensity', 'Variable', NULL, 4 FROM varieties v WHERE v.slug = 'kampung'
UNION ALL SELECT v.id, 'appearance', 'Flesh Color', 'Variable', NULL, 5 FROM varieties v WHERE v.slug = 'kampung';

-- ============================================================
-- TRIGGERS: updated_at auto-update
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER varieties_updated_at BEFORE UPDATE ON varieties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
