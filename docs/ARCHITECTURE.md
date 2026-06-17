# Durian Lens — System Architecture

## Overview

Durian Lens is a mobile-first AI-powered durian variety recognition platform.
It uses computer vision to classify three durian varieties: **Black Thorn**, **D24**, and **Musang King**.

---

## Tech Stack

### Mobile App (React Native + Expo)
- **React Native** 0.73 + **Expo** SDK 50
- **Expo Camera** for live feed
- **Expo Image Picker** for gallery uploads
- **Redux Toolkit** for state management
- **React Navigation** v6
- **Axios** for API calls
- **NativeWind** (Tailwind for RN)

### Backend API (Node.js)
- **Node.js** 20 LTS + **Express.js** 4.x
- **TypeScript** 5.x
- **Prisma ORM** with **PostgreSQL 15**
- **Redis 7** for caching & rate limiting
- **JWT** for authentication
- **Multer** + **Sharp** for image processing
- **Winston** for structured logging

### ML Service (Python)
- **FastAPI** 0.110
- **PyTorch** 2.2 + **torchvision**
- **EfficientNet-B4** fine-tuned on durian dataset
- **Pillow** for image preprocessing
- **Uvicorn** for ASGI serving

### Infrastructure
- **Docker** + **Docker Compose** (dev/staging)
- **PostgreSQL 15** (primary DB)
- **Redis 7** (cache + sessions)
- **AWS S3** (image storage)
- **Nginx** (reverse proxy)
- **GitHub Actions** (CI/CD)

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     MOBILE APP (React Native)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Camera  │  │ Gallery  │  │ History  │  │ Profile  │   │
│  │  Screen  │  │  Upload  │  │  Screen  │  │  Screen  │   │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └──────────┘   │
│       └──────────────┘                                       │
│              Image captured / selected                        │
└──────────────────────┬──────────────────────────────────────┘
                        │ HTTPS + JWT
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     NGINX REVERSE PROXY                      │
│                   Rate limiting + SSL                        │
└──────────────────────┬──────────────────────────────────────┘
                        │
              ┌─────────┴──────────┐
              ▼                    ▼
┌─────────────────────┐  ┌────────────────────┐
│   Node.js API       │  │  ML Service        │
│   Express + TS      │  │  FastAPI + PyTorch │
│                     │  │                    │
│  • /auth/*          │  │  • /predict        │
│  • /scan/*          │──▶  • /health         │
│  • /history/*       │  │                    │
│  • /varieties/*     │  │  EfficientNet-B4   │
│  • /users/*         │  │  3-class classifier│
└────────┬────────────┘  └────────────────────┘
         │
    ┌────┴──────┐
    ▼           ▼
┌────────┐  ┌────────┐
│Postgres│  │ Redis  │
│   DB   │  │ Cache  │
└────────┘  └────────┘
    │
    ▼
┌────────┐
│ AWS S3 │
│(images)│
└────────┘
```

---

## Data Flow

### Scan Flow
1. User captures image via camera or selects from gallery
2. App compresses and uploads image to `POST /api/v1/scan`
3. API validates auth, stores raw image to S3
4. API calls ML service `POST /predict` with image bytes
5. ML returns `{ variety, confidence, probabilities[], processing_ms }`
6. API enriches with variety metadata from DB
7. Saves scan record to PostgreSQL
8. Returns full result to app
9. App displays result card with animation

### Auth Flow
1. Register/Login → JWT access token (15min) + refresh token (30d)
2. Refresh token stored in Redis with device fingerprint
3. Access token sent as `Authorization: Bearer <token>`

---

## ML Model Architecture

### Model: EfficientNet-B4 (fine-tuned)
- **Input**: 224×224 RGB images
- **Output**: 3-class softmax (Black Thorn, D24, Musang King)
- **Training**: Transfer learning on ImageNet weights
- **Dataset**: ~3,000 images per class (augmented)
- **Accuracy**: ~94% top-1 on test set

### Preprocessing Pipeline
1. Resize to 256×256 (maintain aspect ratio with padding)
2. Center crop to 224×224
3. Normalize: mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
4. Apply test-time augmentation (TTA) with 5 crops averaged

### Confidence Thresholds
- ≥ 0.85 → High confidence (show result directly)
- 0.60–0.84 → Medium confidence (show with caution badge)
- < 0.60 → Low confidence (suggest retaking photo)

---

## Database Schema

### Tables
- `users` — authentication & profiles
- `scans` — scan history with results
- `varieties` — durian variety metadata
- `variety_characteristics` — traits per variety
- `feedback` — user correctness feedback

---

## API Design Principles

- **REST** with versioning: `/api/v1/`
- **JWT** authentication on all protected routes
- **Rate limiting**: 100 req/min per user, 10 scans/min
- **Pagination**: cursor-based for history
- **Error format**: `{ success, message, code, details }`
- **Response envelope**: `{ success, data, meta }`