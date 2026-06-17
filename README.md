# Durian Lens

AI-powered durian variety recognition app. Snap a photo of a durian and instantly identify whether it's Musang King, Black Thorn, or D24.

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local backend dev)
- Python 3.11+ (for local ML dev)

### Run with Docker Compose

```bash
cp .env.example .env
# Edit .env and fill in your AWS credentials (or leave S3 fields empty for local dev)
docker compose up --build
```

This starts:
- PostgreSQL 15 on port 5432
- Redis 7 on port 6379
- Node.js API on port 3000
- ML Service on port 8000
- Nginx on port 80

### Seed the database

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### Mobile app

```bash
cd mobile
npm install
npx expo start
```

## Project Structure

```
durian-lens/
├── backend/          # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── routes/   # API routes (auth, scan, history, varieties, users)
│   │   ├── middleware/
│   │   ├── services/
│   │   └── utils/
│   ├── prisma/       # Database schema
│   └── ml_service/   # FastAPI + PyTorch classifier
├── mobile/           # React Native + Expo app
│   ├── src/
│   │   ├── screens/
│   │   ├── navigation/
│   │   ├── services/
│   │   └── store/
├── docs/             # Architecture docs & SQL schema
└── infra/            # Docker, Nginx, K8s configs
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values. Do **not** commit real credentials.

## API Documentation

Base URL: `http://localhost:3000/api/v1`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | No | Health check |
| `/auth/register` | POST | No | Register new user |
| `/auth/login` | POST | No | Login |
| `/auth/refresh` | POST | No | Refresh access token |
| `/auth/me` | GET | Yes | Current user |
| `/scan` | POST | Yes | Upload image for recognition |
| `/scan/:id` | GET | Yes | Get scan details |
| `/scan/:id/feedback` | POST | Yes | Submit correctness feedback |
| `/history` | GET | Yes | Scan history (cursor pagination) |
| `/history/stats` | GET | Yes | User scan statistics |
| `/varieties` | GET | No | List all varieties |
| `/varieties/:slug` | GET | No | Variety details |
