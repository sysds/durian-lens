// src/routes/health.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { redis } from '../utils/redis';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {}

  try {
    await redis.ping();
    redisStatus = 'connected';
  } catch {}

  const healthy = dbStatus === 'connected' && redisStatus === 'connected';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    db: dbStatus,
    redis: redisStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;