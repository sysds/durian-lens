import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { prisma } from './utils/prisma';
import { redis } from './utils/redis';

import authRoutes from './routes/auth';
import scanRoutes from './routes/scan';
import varietyRoutes from './routes/variety';
import historyRoutes from './routes/history';
import userRoutes from './routes/user';
import healthRoutes from './routes/health';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = '/api/v1';

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

// ── Serve uploaded images locally in dev ─────────────────────
if (process.env.NODE_ENV !== 'production') {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));
  logger.info(`Serving local uploads from ${uploadsDir}`);
}

const globalLimiter = rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false });
const scanLimiter   = rateLimit({ windowMs: 60_000, max: 20,  standardHeaders: true, legacyHeaders: false });

app.use(globalLimiter);

app.use(`${API_VERSION}/health`,    healthRoutes);
app.use(`${API_VERSION}/auth`,      authRoutes);
app.use(`${API_VERSION}/varieties`, varietyRoutes);
app.use(`${API_VERSION}/scan`,      authMiddleware, scanLimiter, scanRoutes);
app.use(`${API_VERSION}/history`,   authMiddleware, historyRoutes);
app.use(`${API_VERSION}/users`,     authMiddleware, userRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found`, code: 'NOT_FOUND' });
});

app.use(errorHandler);

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected');
    await redis.ping();
    logger.info('✅ Redis connected');
    app.listen(PORT, () => {
      logger.info(`🌐 Durian Lens API running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

bootstrap();
export default app;
