import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { getSignedUrl } from '../utils/s3';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /history?cursor=<id>&limit=20&variety=<slug>
router.get('/', async (req: AuthRequest, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const cursor = req.query.cursor as string | undefined;
  const variety = req.query.variety as string | undefined;

  const where: any = { user_id: req.userId };
  if (variety) where.predicted_variety = variety;
  if (cursor) where.id = { lt: cursor };

  const scans = await prisma.scans.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: limit + 1,
    include: {
      varieties: {
        select: { name: true, slug: true, thumbnail_url: true },
      },
    },
  });

  const hasMore = scans.length > limit;
  const items = hasMore ? scans.slice(0, limit) : scans;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  // Generate signed URLs (batch)
  const itemsWithUrls = await Promise.all(
    items.map(async (scan: typeof items[0]) => ({
      id: scan.id,
      imageUrl: await getSignedUrl(scan.image_key, 3600),
      predictedVariety: scan.predicted_variety,
      varietyName: scan.varieties?.name,
      varietyThumbnailUrl: scan.varieties?.thumbnail_url,
      confidence: scan.confidence,
      confidenceLevel: scan.confidence_level,
      userFeedback: scan.user_feedback,
      source: scan.source,
      createdAt: scan.created_at,
    }))
  );

  res.json({
    success: true,
    data: itemsWithUrls,
    meta: { limit, hasMore, nextCursor, total: items.length },
  });
});

// GET /history/stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  const [totalScans, byVariety, recentScans] = await Promise.all([
    prisma.scans.count({ where: { user_id: req.userId } }),
    prisma.scans.groupBy({
      by: ['predicted_variety'],
      where: { user_id: req.userId, predicted_variety: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.scans.findMany({
      where: { user_id: req.userId },
      orderBy: { created_at: 'desc' },
      take: 7,
      select: { created_at: true, predicted_variety: true, confidence: true },
    }),
  ]);

  const userStats = await prisma.user_stats.findUnique({ where: { user_id: req.userId! } });

  res.json({
    success: true,
    data: {
      totalScans,
      byVariety,
      recentScans,
      stats: userStats,
    },
  });
});

export default router;