# Durian Lens — Database Keys Reference

## Table 1: users

| Field | Type | Constraint | Reference |
|-------|------|------------|-----------|
| id | uuid | PRIMARY KEY | — |
| email | string | UNIQUE | — |
| password_hash | string | — | — |
| display_name | string | — | — |
| avatar_url | string | — | — |
| role | string | — | — |
| is_verified | boolean | — | — |
| is_active | boolean | — | — |
| last_login_at | timestamp | — | — |
| created_at | timestamp | — | — |
| updated_at | timestamp | — | — |

**Primary Key:** `id`

**Foreign Keys:** None

---

## Table 2: scans

| Field | Type | Constraint | Reference |
|-------|------|------------|-----------|
| id | uuid | PRIMARY KEY | — |
| user_id | uuid | FOREIGN KEY | users.id |
| session_id | string | — | — |
| image_key | string | — | — |
| image_url | string | — | — |
| image_size_bytes | int | — | — |
| image_width | int | — | — |
| image_height | int | — | — |
| predicted_variety | string | — | — |
| variety_id | uuid | FOREIGN KEY | varieties.id |
| confidence | decimal | — | — |
| probabilities | json | — | — |
| confidence_level | string | — | — |
| processing_ms | int | — | — |
| model_version | string | — | — |
| user_feedback | string | — | — |
| feedback_variety | string | — | — |
| feedback_at | timestamp | — | — |
| source | string | — | — |
| latitude | decimal | — | — |
| longitude | decimal | — | — |
| created_at | timestamp | — | — |

**Primary Key:** `id`

**Foreign Keys:**
- `user_id` → `users.id` (ON DELETE SET NULL)
- `variety_id` → `varieties.id`

---

## Table 3: varieties

| Field | Type | Constraint | Reference |
|-------|------|------------|-----------|
| id | uuid | PRIMARY KEY | — |
| slug | string | UNIQUE | — |
| name | string | — | — |
| scientific_name | string | — | — |
| description | string | — | — |
| origin | string | — | — |
| season | string | — | — |
| price_range | string | — | — |
| thumbnail_url | string | — | — |
| banner_url | string | — | — |
| is_active | boolean | — | — |
| sort_order | int | — | — |
| created_at | timestamp | — | — |
| updated_at | timestamp | — | — |

**Primary Key:** `id`

**Foreign Keys:** None

---

## Table 4: variety_characteristics

| Field | Type | Constraint | Reference |
|-------|------|------------|-----------|
| id | uuid | PRIMARY KEY | — |
| variety_id | uuid | FOREIGN KEY | varieties.id |
| category | string | — | — |
| label | string | — | — |
| value | string | — | — |
| score | int | — | — |
| sort_order | int | — | — |

**Primary Key:** `id`

**Foreign Keys:**
- `variety_id` → `varieties.id` (ON DELETE CASCADE)

---

## Table 5: user_stats

| Field | Type | Constraint | Reference |
|-------|------|------------|-----------|
| user_id | uuid | PRIMARY KEY + FOREIGN KEY | users.id |
| total_scans | int | — | — |
| scans_today | int | — | — |
| favorite_variety | string | — | — |
| accuracy_rate | decimal | — | — |
| streak_days | int | — | — |
| last_scan_at | timestamp | — | — |
| updated_at | timestamp | — | — |

**Primary Key:** `user_id`

**Foreign Keys:**
- `user_id` → `users.id` (ON DELETE CASCADE)

**Note:** `user_id` serves as both the primary key and foreign key (one-to-one relationship).

---

## Table 6: refresh_tokens

| Field | Type | Constraint | Reference |
|-------|------|------------|-----------|
| id | uuid | PRIMARY KEY | — |
| user_id | uuid | FOREIGN KEY | users.id |
| token_hash | string | — | — |
| device_info | json | — | — |
| expires_at | timestamp | — | — |
| revoked_at | timestamp | — | — |
| created_at | timestamp | — | — |

**Primary Key:** `id`

**Foreign Keys:**
- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table 7: ml_feedback

| Field | Type | Constraint | Reference |
|-------|------|------------|-----------|
| id | uuid | PRIMARY KEY | — |
| scan_id | uuid | FOREIGN KEY | scans.id |
| user_id | uuid | FOREIGN KEY (nullable) | users.id |
| predicted | string | — | — |
| actual | string | — | — |
| confidence | decimal | — | — |
| notes | string | — | — |
| reviewed | boolean | — | — |
| created_at | timestamp | — | — |

**Primary Key:** `id`

**Foreign Keys:**
- `scan_id` → `scans.id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE SET NULL)

---

## Table 8: api_keys

| Field | Type | Constraint | Reference |
|-------|------|------------|-----------|
| id | uuid | PRIMARY KEY | — |
| user_id | uuid | FOREIGN KEY | users.id |
| name | string | — | — |
| key_hash | string | — | — |
| key_prefix | string | — | — |
| permissions | string[] | — | — |
| rate_limit | int | — | — |
| last_used_at | timestamp | — | — |
| expires_at | timestamp | — | — |
| is_active | boolean | — | — |
| created_at | timestamp | — | — |

**Primary Key:** `id`

**Foreign Keys:**
- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Relationship Summary

| Parent Table | Child Table | Relationship | Foreign Key |
|--------------|-------------|--------------|-------------|
| users | scans | One-to-Many | scans.user_id |
| users | user_stats | One-to-One | user_stats.user_id |
| users | refresh_tokens | One-to-Many | refresh_tokens.user_id |
| users | ml_feedback | One-to-Many | ml_feedback.user_id |
| users | api_keys | One-to-Many | api_keys.user_id |
| varieties | scans | One-to-Many | scans.variety_id |
| varieties | variety_characteristics | One-to-Many | variety_characteristics.variety_id |
| scans | ml_feedback | One-to-Many | ml_feedback.scan_id |
