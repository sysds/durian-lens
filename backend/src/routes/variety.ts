// src/routes/variety.ts
import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { redis } from '../utils/redis';

const router = Router();
const CACHE_TTL = 3600;

// GET /varieties
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'varieties:all';
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached), meta: { fromCache: true } });
    }

    const varieties = await prisma.varieties.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
      include: { variety_characteristics: { orderBy: { sort_order: 'asc' } } },
    });

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(varieties));
    res.json({ success: true, data: varieties, meta: { fromCache: false } });
  } catch (err) {
    next(err);
  }
});

// GET /varieties/:slug
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const cacheKey = `variety:${slug}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached), meta: { fromCache: true } });
    }

    const variety = await prisma.varieties.findUnique({
      where: { slug },
      include: { variety_characteristics: { orderBy: { sort_order: 'asc' } } },
    });

    if (!variety) throw new AppError('Variety not found', 404, 'NOT_FOUND');

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(variety));
    res.json({ success: true, data: variety });
  } catch (err) {
    next(err);
  }
});

export default router;
