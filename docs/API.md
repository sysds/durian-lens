# Durian Lens — API Endpoints Reference

Base URL: `https://api.durianlens.app/api/v1`

All protected endpoints require: `Authorization: Bearer <access_token>`

---

## Authentication

### POST /auth/register
Register new user account.

**Body:**
```json
{
  "email": "seller@example.com",
  "password": "securepassword",
  "displayName": "Ahmad Rizal",
  "role": "seller"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "displayName": "...", "role": "seller" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### POST /auth/login
Authenticate existing user.

**Body:** `{ "email", "password" }`

---

### POST /auth/refresh
Exchange refresh token for new access token.

**Body:** `{ "refreshToken": "eyJ..." }`

---

### POST /auth/logout
Revoke all refresh tokens for current user.

---

### GET /auth/me
Get current user profile.

---

## Scan

### POST /scan ⭐ Core Feature
Upload image and get durian variety prediction.

**Headers:** `Authorization: Bearer <token>`
**Content-Type:** `multipart/form-data`

**Form Fields:**
- `image` (file, required) — JPEG/PNG/WebP, max 15MB
- `source` (string) — "camera" | "gallery" | "api"
- `latitude` (number, optional)
- `longitude` (number, optional)

**Response 201:**
```json
{
  "success": true,
  "data": {
    "scan": {
      "id": "uuid",
      "imageUrl": "https://cdn.../signed-url",
      "source": "camera",
      "createdAt": "2024-04-15T10:30:00Z"
    },
    "result": {
      "variety": "musang-king",
      "confidence": 0.9274,
      "confidenceLevel": "high",
      "probabilities": {
        "musang-king": 0.9274,
        "black-thorn": 0.0481,
        "d24": 0.0245
      },
      "processingMs": 234,
      "modelVersion": "1.0.0"
    },
    "variety": {
      "id": "uuid",
      "slug": "musang-king",
      "name": "Musang King",
      "description": "The undisputed King...",
      "origin": "Kelantan and Pahang, Malaysia",
      "season": "April – August",
      "priceRange": "MYR 25–80/kg",
      "thumbnailUrl": "https://...",
      "characteristics": [
        { "category": "flavor", "label": "Sweetness", "value": "8/10", "score": 8 },
        ...
      ]
    }
  }
}
```

**Errors:**
- `400 MISSING_IMAGE` — No image provided
- `422 IMAGE_PROCESS_ERROR` — Cannot process image
- `429 SCAN_RATE_LIMITED` — Too many scans (10/min)
- `503 ML_SERVICE_ERROR` — AI service unavailable

---

### GET /scan/:id
Get a specific scan result by ID.

---

### POST /scan/:id/feedback
Submit correctness feedback for ML improvement.

**Body:**
```json
{
  "feedback": "incorrect",
  "actualVariety": "black-thorn"
}
```

---

## History

### GET /history
Get paginated scan history (cursor-based).

**Query Parameters:**
- `limit` (default: 20, max: 50)
- `cursor` — Scan ID for pagination
- `variety` — Filter by variety slug

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "imageUrl": "https://...",
      "predictedVariety": "musang-king",
      "varietyName": "Musang King",
      "confidence": 0.9274,
      "confidenceLevel": "high",
      "userFeedback": "correct",
      "source": "camera",
      "createdAt": "2024-04-15T10:30:00Z"
    }
  ],
  "meta": {
    "limit": 20,
    "hasMore": true,
    "nextCursor": "uuid",
    "total": 20
  }
}
```

---

### GET /history/stats
Get aggregated scan statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalScans": 47,
    "byVariety": [
      { "predicted_variety": "musang-king", "_count": { "id": 28 } },
      { "predicted_variety": "d24", "_count": { "id": 12 } },
      { "predicted_variety": "black-thorn", "_count": { "id": 7 } }
    ],
    "recentScans": [...],
    "stats": {
      "totalScans": 47,
      "favoriteVariety": "musang-king",
      "accuracyRate": 0.94,
      "streakDays": 5
    }
  }
}
```

---

## Varieties

### GET /varieties
Get all durian varieties with characteristics.
*(Cached 1h)*

### GET /varieties/:slug
Get a specific variety by slug.
*(Cached 1h)*

---

## ML Service (Internal)

### POST /predict
*(Called by API service only, not exposed to clients)*

**Input:** `multipart/form-data` with `image` field

**Response:**
```json
{
  "variety": "musang-king",
  "confidence": 0.9274,
  "probabilities": {
    "black-thorn": 0.0481,
    "d24": 0.0245,
    "musang-king": 0.9274
  },
  "model_version": "1.0.0",
  "processing_ms": 187,
  "tta_used": true
}
```

### GET /health
ML service health check.

---

## Error Response Format

All errors follow:
```json
{
  "success": false,
  "message": "Human-readable error",
  "code": "MACHINE_READABLE_CODE",
  "details": { ... }
}
```

Common codes: `UNAUTHORIZED`, `INVALID_TOKEN`, `NOT_FOUND`, 
`RATE_LIMITED`, `SCAN_RATE_LIMITED`, `MISSING_IMAGE`, 
`IMAGE_PROCESS_ERROR`, `ML_SERVICE_ERROR`, `EMAIL_EXISTS`, 
`INVALID_CREDENTIALS`, `VALIDATION_ERROR`