import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { getSignedUrl, deleteFromS3 } from '../utils/s3';
import { redis } from '../utils/redis';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const router = Router();

type AdminScan = Prisma.scansGetPayload<{
  include: {
    user: { select: { id: true; email: true; display_name: true } };
    varieties: { select: { name: true; slug: true } };
  };
}>;

type RecentScan = Prisma.scansGetPayload<{
  include: {
    user: { select: { email: true; display_name: true } };
    varieties: { select: { name: true; slug: true } };
  };
}>;

type AdminUser = Prisma.usersGetPayload<{
  include: { user_stats: true };
}>;

type AdminFeedback = Prisma.ml_feedbackGetPayload<{
  include: {
    user: { select: { email: true; display_name: true } };
    scan: { select: { id: true; user_feedback: true; feedback_variety: true; feedback_at: true; created_at: true } };
  };
}>;

function toNumber(value: any) {
  if (value === null || value === undefined) return null;
  return typeof value.toNumber === 'function' ? value.toNumber() : Number(value);
}

function parseDate(value: unknown) {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateRange(from: unknown, to: unknown) {
  const range: any = {};
  const start = parseDate(from);
  const end = parseDate(to);
  if (start) range.gte = start;
  if (end) {
    end.setHours(23, 59, 59, 999);
    range.lte = end;
  }
  return Object.keys(range).length ? range : null;
}

function sortDirection(value: unknown) {
  return value === 'asc' ? 'asc' : 'desc';
}

function scanOrderBy(value: unknown) {
  if (value === 'date_asc') return { created_at: 'asc' as const };
  if (value === 'confidence_desc') return { confidence: 'desc' as const };
  if (value === 'confidence_asc') return { confidence: 'asc' as const };
  if (value === 'processing_desc') return { processing_ms: 'desc' as const };
  if (value === 'processing_asc') return { processing_ms: 'asc' as const };
  return { created_at: 'desc' as const };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function serializeAdminUser(user: AdminUser) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
    isActive: user.is_active,
    isVerified: user.is_verified,
    totalScans: user.user_stats?.total_scans || 0,
    lastScanAt: user.user_stats?.last_scan_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    lastLoginAt: user.last_login_at,
  };
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfDay(date: Date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

async function ensureSupportTicketsTable() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      subject VARCHAR(120) NOT NULL,
      message TEXT NOT NULL,
      reviewed BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

router.get('/overview', async (_req: AuthRequest, res: Response) => {
  const today = startOfToday();
  const weekStart = startOfDay(new Date());
  weekStart.setDate(weekStart.getDate() - 6);
  const previousWeekStart = startOfDay(new Date());
  previousWeekStart.setDate(previousWeekStart.getDate() - 13);
  await ensureSupportTicketsTable();

  const [
    totalUsers,
    activeUsers,
    totalScans,
    scansToday,
    scansThisWeek,
    scansPreviousWeek,
    usersThisWeek,
    usersPreviousWeek,
    totalVarieties,
    feedbackTotal,
    feedbackThisWeek,
    feedbackPreviousWeek,
    unreviewedFeedback,
    confidence,
    feedbackByStatus,
    topVarieties,
    feedbackByVariety,
    recentScans,
    weeklyRawScans,
  ] = await Promise.all([
    prisma.users.count(),
    prisma.users.count({ where: { is_active: true } }),
    prisma.scans.count(),
    prisma.scans.count({ where: { created_at: { gte: today } } }),
    prisma.scans.count({ where: { created_at: { gte: weekStart } } }),
    prisma.scans.count({ where: { created_at: { gte: previousWeekStart, lt: weekStart } } }),
    prisma.users.count({ where: { created_at: { gte: weekStart } } }),
    prisma.users.count({ where: { created_at: { gte: previousWeekStart, lt: weekStart } } }),
    prisma.varieties.count({ where: { is_active: true } }),
    prisma.ml_feedback.count(),
    prisma.ml_feedback.count({ where: { created_at: { gte: weekStart } } }),
    prisma.ml_feedback.count({ where: { created_at: { gte: previousWeekStart, lt: weekStart } } }),
    prisma.ml_feedback.count({ where: { reviewed: false } }),
    prisma.scans.aggregate({ _avg: { confidence: true } }),
    prisma.scans.groupBy({
      by: ['user_feedback'],
      where: { user_feedback: { not: null } },
      _count: { id: true },
    }),
    prisma.scans.groupBy({
      by: ['predicted_variety'],
      where: { predicted_variety: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    prisma.scans.groupBy({
      by: ['predicted_variety', 'user_feedback'],
      where: { predicted_variety: { not: null }, user_feedback: { in: ['correct', 'incorrect', 'unsure'] } },
      _count: { id: true },
    }),
    prisma.scans.findMany({
      orderBy: { created_at: 'desc' },
      take: 8,
      include: {
        user: { select: { email: true, display_name: true } },
        varieties: { select: { name: true, slug: true } },
      },
    }),
    prisma.scans.findMany({
      where: { created_at: { gte: weekStart } },
      select: { created_at: true },
      orderBy: { created_at: 'asc' },
    }),
  ]);
  const [[supportTotal], [supportThisWeek], [supportPreviousWeek], [supportOpen]] = await Promise.all([
    prisma.$queryRaw<Array<{ count: number }>>`SELECT COUNT(*)::int AS count FROM support_tickets`,
    prisma.$queryRaw<Array<{ count: number }>>`SELECT COUNT(*)::int AS count FROM support_tickets WHERE created_at >= ${weekStart}`,
    prisma.$queryRaw<Array<{ count: number }>>`SELECT COUNT(*)::int AS count FROM support_tickets WHERE created_at >= ${previousWeekStart} AND created_at < ${weekStart}`,
    prisma.$queryRaw<Array<{ count: number }>>`SELECT COUNT(*)::int AS count FROM support_tickets WHERE reviewed = false`,
  ]);

  const weeklyScans = Array.from({ length: 7 }, (_, index) => {
    const day = startOfDay(new Date(weekStart));
    day.setDate(weekStart.getDate() + index);
    const key = day.toISOString().slice(0, 10);
    const count = weeklyRawScans.filter((scan) => scan.created_at.toISOString().slice(0, 10) === key).length;
    return {
      date: key,
      label: day.toLocaleDateString('en-MY', { weekday: 'short' }),
      count,
    };
  });

  const feedbackAccuracy = new Map<string, { correct: number; total: number }>();
  feedbackByVariety.forEach((item) => {
    if (!item.predicted_variety) return;
    const current = feedbackAccuracy.get(item.predicted_variety) || { correct: 0, total: 0 };
    current.total += item._count.id;
    if (item.user_feedback === 'correct') current.correct += item._count.id;
    feedbackAccuracy.set(item.predicted_variety, current);
  });

  const topVarietyStats = topVarieties.map((item) => {
    const accuracy = feedbackAccuracy.get(item.predicted_variety || '');
    return {
      predicted_variety: item.predicted_variety,
      count: item._count.id,
      accuracy: accuracy && accuracy.total > 0 ? accuracy.correct / accuracy.total : null,
      feedbackCount: accuracy?.total || 0,
    };
  });

  res.json({
    success: true,
    data: {
      totals: {
        users: totalUsers,
        activeUsers,
        scans: totalScans,
        scansToday,
        varieties: totalVarieties,
        feedback: feedbackTotal,
        tickets: supportTotal?.count || 0,
        averageConfidence: toNumber(confidence._avg.confidence),
      },
      trends: {
        users: usersThisWeek - usersPreviousWeek,
        scans: scansThisWeek - scansPreviousWeek,
        scansToday,
        feedback: feedbackThisWeek - feedbackPreviousWeek,
        tickets: (supportThisWeek?.count || 0) - (supportPreviousWeek?.count || 0),
        activeUsers,
      },
      unreviewedFeedback,
      unreviewedTickets: supportOpen?.count || 0,
      feedbackByStatus,
      weeklyScans,
      topVarieties: topVarietyStats,
      recentScans: recentScans.map((scan: RecentScan) => ({
        id: scan.id,
        user: scan.user?.display_name || scan.user?.email || 'Unknown user',
        predictedVariety: scan.predicted_variety,
        varietyName: scan.varieties?.name,
        confidence: toNumber(scan.confidence),
        userFeedback: scan.user_feedback,
        createdAt: scan.created_at,
      })),
    },
  });
});

router.get('/scans', async (req: AuthRequest, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
  const variety = req.query.variety as string | undefined;
  const confidenceLevel = req.query.confidenceLevel as string | undefined;
  const source = req.query.source as string | undefined;
  const createdRange = dateRange(req.query.from, req.query.to);
  const where: any = {};

  if (variety) where.predicted_variety = variety;
  if (confidenceLevel && confidenceLevel !== 'all') where.confidence_level = confidenceLevel;
  if (source && source !== 'all') where.source = source;
  if (createdRange) where.created_at = createdRange;

  const scans = await prisma.scans.findMany({
    where,
    orderBy: scanOrderBy(req.query.sort),
    take: limit,
    include: {
      user: { select: { id: true, email: true, display_name: true } },
      varieties: { select: { name: true, slug: true } },
    },
  });

  const data = await Promise.all(
    scans.map(async (scan: AdminScan) => ({
      id: scan.id,
      imageUrl: await getSignedUrl(scan.image_key, 3600),
      user: scan.user,
      predictedVariety: scan.predicted_variety,
      varietyName: scan.varieties?.name,
      confidence: toNumber(scan.confidence),
      confidenceLevel: scan.confidence_level,
      userFeedback: scan.user_feedback,
      processingMs: scan.processing_ms,
      source: scan.source,
      createdAt: scan.created_at,
    })),
  );

  res.json({ success: true, data });
});

router.get('/scans/:id', async (req: AuthRequest, res: Response) => {
  const scan = await prisma.scans.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, email: true, display_name: true } },
      varieties: { select: { name: true, slug: true } },
      ml_feedback: {
        orderBy: { created_at: 'desc' },
        select: { id: true, actual: true, notes: true, reviewed: true, created_at: true },
      },
    },
  });

  if (!scan) throw new AppError('Scan not found', 404, 'NOT_FOUND');

  res.json({
    success: true,
    data: {
      id: scan.id,
      imageUrl: await getSignedUrl(scan.image_key, 3600),
      imageKey: scan.image_key,
      imageSizeBytes: scan.image_size_bytes,
      imageWidth: scan.image_width,
      imageHeight: scan.image_height,
      user: scan.user,
      predictedVariety: scan.predicted_variety,
      varietyName: scan.varieties?.name,
      confidence: toNumber(scan.confidence),
      confidenceLevel: scan.confidence_level,
      probabilities: scan.probabilities,
      processingMs: scan.processing_ms,
      modelVersion: scan.model_version,
      source: scan.source,
      latitude: toNumber(scan.latitude),
      longitude: toNumber(scan.longitude),
      userFeedback: scan.user_feedback,
      feedbackVariety: scan.feedback_variety,
      feedbackAt: scan.feedback_at,
      feedbackItems: scan.ml_feedback.map((item) => ({
        id: item.id,
        actual: item.actual,
        notes: item.notes,
        reviewed: item.reviewed,
        createdAt: item.created_at,
      })),
      createdAt: scan.created_at,
    },
  });
});

router.delete('/scans/:id', async (req: AuthRequest, res: Response) => {
  const scan = await prisma.scans.findUnique({
    where: { id: req.params.id },
    select: { id: true, image_key: true, user_id: true },
  });

  if (!scan) throw new AppError('Scan not found', 404, 'NOT_FOUND');

  await prisma.ml_feedback.deleteMany({ where: { scan_id: scan.id } });
  await prisma.scans.delete({ where: { id: scan.id } });
  deleteFromS3(scan.image_key).catch((err: any) => logger.error(`Admin scan image delete failed ${scan.image_key}:`, err));

  if (scan.user_id) {
    const [totalScans, latestScan] = await Promise.all([
      prisma.scans.count({ where: { user_id: scan.user_id } }),
      prisma.scans.findFirst({
        where: { user_id: scan.user_id },
        orderBy: { created_at: 'desc' },
        select: { created_at: true },
      }),
    ]);

    await prisma.user_stats.upsert({
      where: { user_id: scan.user_id },
      update: { total_scans: totalScans, last_scan_at: latestScan?.created_at || null },
      create: { user_id: scan.user_id, total_scans: totalScans, last_scan_at: latestScan?.created_at || null },
    });
  }

  res.json({ success: true, message: 'Scan deleted' });
});

router.get('/users', async (req: AuthRequest, res: Response) => {
  const createdRange = dateRange(req.query.from, req.query.to);
  const sort = sortDirection(req.query.sort);
  const role = req.query.role as string | undefined;
  const status = req.query.status as string | undefined;
  const where: any = {};

  if (createdRange) where.created_at = createdRange;
  if (role && role !== 'all') where.role = role;
  if (status === 'active') where.is_active = true;
  if (status === 'disabled') where.is_active = false;

  const users = await prisma.users.findMany({
    where,
    orderBy: { created_at: sort },
    take: 100,
    include: { user_stats: true },
  });

  res.json({
    success: true,
    data: users.map(serializeAdminUser),
  });
});

router.post(
  '/users',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('displayName').optional({ nullable: true }).isLength({ min: 1, max: 100 }).trim(),
    body('role').optional().isIn(['user', 'seller', 'farmer', 'admin']),
    body('isActive').optional().isBoolean(),
    body('isVerified').optional().isBoolean(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: errors.array() });
    }

    const existing = await prisma.users.findUnique({ where: { email: req.body.email } });
    if (existing) throw new AppError('A user with this email already exists', 409, 'USER_EXISTS');

    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await prisma.$transaction(async (tx: any) => {
      const created = await tx.users.create({
        data: {
          email: req.body.email,
          password_hash: passwordHash,
          display_name: req.body.displayName || null,
          role: req.body.role || 'user',
          is_active: req.body.isActive ?? true,
          is_verified: req.body.isVerified ?? true,
        },
        include: { user_stats: true },
      });
      await tx.user_stats.create({ data: { user_id: created.id } });
      return tx.users.findUniqueOrThrow({ where: { id: created.id }, include: { user_stats: true } });
    });

    res.status(201).json({ success: true, data: serializeAdminUser(user) });
  },
);

router.get('/users/:id', async (req: AuthRequest, res: Response) => {
  const user = await prisma.users.findUnique({
    where: { id: req.params.id },
    include: { user_stats: true },
  });

  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  const [feedbackCount, openFeedbackCount, recentScans] = await Promise.all([
    prisma.ml_feedback.count({ where: { user_id: user.id } }),
    prisma.ml_feedback.count({ where: { user_id: user.id, reviewed: false } }),
    prisma.scans.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      take: 5,
      include: { varieties: { select: { name: true } } },
    }),
  ]);

  res.json({
    success: true,
    data: {
      ...serializeAdminUser(user),
      feedbackCount,
      openFeedbackCount,
      recentScans: recentScans.map((scan) => ({
        id: scan.id,
        predictedVariety: scan.predicted_variety,
        varietyName: scan.varieties?.name,
        confidence: toNumber(scan.confidence),
        userFeedback: scan.user_feedback,
        createdAt: scan.created_at,
      })),
    },
  });
});

router.patch(
  '/users/:id',
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isLength({ min: 8 }),
    body('displayName').optional({ nullable: true }).isLength({ min: 1, max: 100 }).trim(),
    body('role').optional().isIn(['user', 'seller', 'farmer', 'admin']),
    body('isActive').optional().isBoolean(),
    body('isVerified').optional().isBoolean(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: errors.array() });
    }

    if (req.body.email) {
      const existing = await prisma.users.findUnique({ where: { email: req.body.email } });
      if (existing && existing.id !== req.params.id) {
        throw new AppError('A user with this email already exists', 409, 'USER_EXISTS');
      }
    }

    const data: any = {};
    if (req.body.email !== undefined) data.email = req.body.email;
    if (req.body.displayName !== undefined) data.display_name = req.body.displayName || null;
    if (req.body.role !== undefined) data.role = req.body.role;
    if (req.body.isActive !== undefined) data.is_active = req.body.isActive;
    if (req.body.isVerified !== undefined) data.is_verified = req.body.isVerified;
    if (req.body.password) data.password_hash = await bcrypt.hash(req.body.password, 12);

    const user = await prisma.users.update({
      where: { id: req.params.id },
      data,
      include: { user_stats: true },
    });

    res.json({ success: true, data: serializeAdminUser(user) });
  },
);

router.patch(
  '/users/:id/status',
  [body('isActive').isBoolean()],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: errors.array() });
    }

    const user = await prisma.users.update({
      where: { id: req.params.id },
      data: { is_active: req.body.isActive },
    });

    res.json({ success: true, data: { id: user.id, isActive: user.is_active } });
  },
);

router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  if (req.params.id === req.userId) {
    throw new AppError('You cannot delete your own admin account while signed in', 400, 'CANNOT_DELETE_SELF');
  }

  const user = await prisma.users.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  await prisma.users.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'User deleted' });
});

router.get('/varieties', async (req: AuthRequest, res: Response) => {
  const sort = sortDirection(req.query.sort);
  const status = req.query.status as string | undefined;
  const where: any = {};
  if (status === 'active') where.is_active = true;
  if (status === 'disabled') where.is_active = false;

  const varieties = await prisma.varieties.findMany({
    where,
    orderBy: { created_at: sort },
    include: {
      _count: { select: { scans: true } },
      variety_characteristics: { orderBy: { sort_order: 'asc' } },
    },
  });

  res.json({
    success: true,
    data: varieties.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      scientificName: item.scientific_name,
      description: item.description,
      origin: item.origin,
      season: item.season,
      priceRange: item.price_range,
      thumbnailUrl: item.thumbnail_url,
      bannerUrl: item.banner_url,
      isActive: item.is_active,
      sortOrder: item.sort_order,
      scanCount: item._count.scans,
      characteristics: item.variety_characteristics,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })),
  });
});

router.post(
  '/varieties',
  [
    body('name').isLength({ min: 1, max: 100 }).trim(),
    body('slug').optional({ nullable: true }).isLength({ min: 1, max: 50 }).trim(),
    body('scientificName').optional({ nullable: true }).isLength({ max: 150 }).trim(),
    body('description').optional({ nullable: true }).isLength({ max: 5000 }).trim(),
    body('origin').optional({ nullable: true }).isLength({ max: 100 }).trim(),
    body('season').optional({ nullable: true }).isLength({ max: 100 }).trim(),
    body('priceRange').optional({ nullable: true }).isLength({ max: 50 }).trim(),
    body('thumbnailUrl').optional({ nullable: true }).isURL().trim(),
    body('bannerUrl').optional({ nullable: true }).isURL().trim(),
    body('sortOrder').optional().isInt(),
    body('isActive').optional().isBoolean(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: errors.array() });
    }

    const slug = slugify(req.body.slug || req.body.name);
    if (!slug) throw new AppError('Slug could not be generated', 400, 'INVALID_SLUG');
    const existing = await prisma.varieties.findUnique({ where: { slug } });
    if (existing) throw new AppError('A variety with this slug already exists', 409, 'VARIETY_EXISTS');

    const item = await prisma.varieties.create({
      data: {
        slug,
        name: req.body.name,
        scientific_name: req.body.scientificName || null,
        description: req.body.description || null,
        origin: req.body.origin || null,
        season: req.body.season || null,
        price_range: req.body.priceRange || null,
        thumbnail_url: req.body.thumbnailUrl || null,
        banner_url: req.body.bannerUrl || null,
        sort_order: Number(req.body.sortOrder || 0),
        is_active: req.body.isActive ?? true,
      },
    });

    await redis.del('varieties:all');
    res.status(201).json({ success: true, data: item });
  },
);

router.get('/varieties/:id', async (req: AuthRequest, res: Response) => {
  const item = await prisma.varieties.findUnique({
    where: { id: req.params.id },
    include: {
      _count: { select: { scans: true } },
      variety_characteristics: { orderBy: { sort_order: 'asc' } },
    },
  });

  if (!item) throw new AppError('Variety not found', 404, 'NOT_FOUND');
  res.json({ success: true, data: item });
});

router.patch(
  '/varieties/:id',
  [
    body('name').optional().isLength({ min: 1, max: 100 }).trim(),
    body('slug').optional({ nullable: true }).isLength({ min: 1, max: 50 }).trim(),
    body('scientificName').optional({ nullable: true }).isLength({ max: 150 }).trim(),
    body('description').optional({ nullable: true }).isLength({ max: 5000 }).trim(),
    body('origin').optional({ nullable: true }).isLength({ max: 100 }).trim(),
    body('season').optional({ nullable: true }).isLength({ max: 100 }).trim(),
    body('priceRange').optional({ nullable: true }).isLength({ max: 50 }).trim(),
    body('thumbnailUrl').optional({ nullable: true }).isURL().trim(),
    body('bannerUrl').optional({ nullable: true }).isURL().trim(),
    body('sortOrder').optional().isInt(),
    body('isActive').optional().isBoolean(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: errors.array() });
    }

    const existing = await prisma.varieties.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Variety not found', 404, 'NOT_FOUND');

    const data: any = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.slug !== undefined) {
      data.slug = slugify(req.body.slug || req.body.name || existing.name);
      const duplicate = await prisma.varieties.findUnique({ where: { slug: data.slug } });
      if (duplicate && duplicate.id !== req.params.id) {
        throw new AppError('A variety with this slug already exists', 409, 'VARIETY_EXISTS');
      }
    }
    if (req.body.scientificName !== undefined) data.scientific_name = req.body.scientificName || null;
    if (req.body.description !== undefined) data.description = req.body.description || null;
    if (req.body.origin !== undefined) data.origin = req.body.origin || null;
    if (req.body.season !== undefined) data.season = req.body.season || null;
    if (req.body.priceRange !== undefined) data.price_range = req.body.priceRange || null;
    if (req.body.thumbnailUrl !== undefined) data.thumbnail_url = req.body.thumbnailUrl || null;
    if (req.body.bannerUrl !== undefined) data.banner_url = req.body.bannerUrl || null;
    if (req.body.sortOrder !== undefined) data.sort_order = Number(req.body.sortOrder);
    if (req.body.isActive !== undefined) data.is_active = req.body.isActive;

    const item = await prisma.varieties.update({ where: { id: req.params.id }, data });
    await redis.del('varieties:all', `variety:${existing.slug}`, `variety:${item.slug}`);
    res.json({ success: true, data: item });
  },
);

router.delete('/varieties/:id', async (req: AuthRequest, res: Response) => {
  const item = await prisma.varieties.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { scans: true } } },
  });
  if (!item) throw new AppError('Variety not found', 404, 'NOT_FOUND');
  if (item._count.scans > 0) {
    await prisma.varieties.update({ where: { id: item.id }, data: { is_active: false } });
    await redis.del('varieties:all', `variety:${item.slug}`);
    return res.json({ success: true, message: 'Variety has scans, so it was disabled instead of deleted' });
  }

  await prisma.varieties.delete({ where: { id: item.id } });
  await redis.del('varieties:all', `variety:${item.slug}`);
  res.json({ success: true, message: 'Variety deleted' });
});

router.get('/tickets', async (req: AuthRequest, res: Response) => {
  await ensureSupportTicketsTable();
  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to);
  if (to) to.setHours(23, 59, 59, 999);
  const status = (req.query.status as string | undefined) || 'all';
  const sort = sortDirection(req.query.sort);

  const tickets = await prisma.$queryRaw<Array<{
    id: string;
    user_id: string | null;
    user: string | null;
    email: string | null;
    subject: string;
    message: string;
    reviewed: boolean;
    created_at: Date;
  }>>`
    SELECT support_tickets.id,
           support_tickets.user_id,
           COALESCE(users.display_name, users.email) AS user,
           users.email,
           support_tickets.subject,
           support_tickets.message,
           support_tickets.reviewed,
           support_tickets.created_at
    FROM support_tickets
    LEFT JOIN users ON users.id = support_tickets.user_id
    WHERE (${from}::timestamptz IS NULL OR support_tickets.created_at >= ${from})
      AND (${to}::timestamptz IS NULL OR support_tickets.created_at <= ${to})
      AND (${status} = 'all' OR (${status} = 'open' AND support_tickets.reviewed = false) OR (${status} = 'reviewed' AND support_tickets.reviewed = true))
    ORDER BY support_tickets.created_at ${sort === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`}
    LIMIT 100
  `;

  res.json({
    success: true,
    data: tickets.map((ticket) => ({
      id: ticket.id,
      userId: ticket.user_id,
      user: ticket.user || 'Unknown user',
      email: ticket.email,
      subject: ticket.subject,
      message: ticket.message,
      reviewed: ticket.reviewed,
      createdAt: ticket.created_at,
    })),
  });
});

router.patch(
  '/tickets/:id',
  [body('reviewed').isBoolean()],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: errors.array() });
    }

    await ensureSupportTicketsTable();
    await prisma.$executeRaw`UPDATE support_tickets SET reviewed = ${req.body.reviewed} WHERE id = ${req.params.id}`;
    res.json({ success: true, data: { id: req.params.id, reviewed: req.body.reviewed } });
  },
);

router.get('/feedback', async (req: AuthRequest, res: Response) => {
  await ensureSupportTicketsTable();
  const createdRange = dateRange(req.query.from, req.query.to);
  const sort = sortDirection(req.query.sort);
  const variety = req.query.variety as string | undefined;
  const status = req.query.status as string | undefined;
  const type = req.query.type as string | undefined;
  const feedbackWhere: any = {};
  if (createdRange) feedbackWhere.created_at = createdRange;
  if (variety) feedbackWhere.OR = [{ predicted: variety }, { actual: variety }];
  if (status === 'open') feedbackWhere.reviewed = false;
  if (status === 'reviewed') feedbackWhere.reviewed = true;

  const [feedback, supportTickets] = await Promise.all([
    prisma.ml_feedback.findMany({
      where: type === 'support' ? { id: '00000000-0000-0000-0000-000000000000' } : feedbackWhere,
      orderBy: { created_at: sort },
      take: 100,
      include: {
        user: { select: { email: true, display_name: true } },
        scan: { select: { id: true, user_feedback: true, feedback_variety: true, feedback_at: true, created_at: true } },
      },
    }),
    type === 'scan' || variety ? Promise.resolve([]) : prisma.$queryRaw<Array<{
      id: string;
      user: string | null;
      subject: string;
      message: string;
      reviewed: boolean;
      created_at: Date;
    }>>`
      SELECT support_tickets.id,
             COALESCE(users.display_name, users.email) AS user,
             support_tickets.subject,
             support_tickets.message,
             support_tickets.reviewed,
             support_tickets.created_at
      FROM support_tickets
      LEFT JOIN users ON users.id = support_tickets.user_id
      WHERE (${parseDate(req.query.from) || null}::timestamptz IS NULL OR support_tickets.created_at >= ${parseDate(req.query.from) || null})
        AND (${parseDate(req.query.to) || null}::timestamptz IS NULL OR support_tickets.created_at <= ${(() => {
          const end = parseDate(req.query.to);
          if (end) end.setHours(23, 59, 59, 999);
          return end;
        })() || null})
        AND (${status || 'all'} = 'all' OR (${status || 'all'} = 'open' AND support_tickets.reviewed = false) OR (${status || 'all'} = 'reviewed' AND support_tickets.reviewed = true))
      ORDER BY support_tickets.created_at ${sort === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`}
      LIMIT 100
    `,
  ]);

  res.json({
    success: true,
    data: [
      ...feedback.map((item: AdminFeedback) => ({
      id: item.id,
      type: 'scan',
      user: item.user?.display_name || item.user?.email || 'Unknown user',
      predicted: item.predicted,
      actual: item.actual,
      notes: item.notes,
      confidence: toNumber(item.confidence),
      reviewed: item.reviewed,
      createdAt: item.created_at,
      scanId: item.scan?.id || item.scan_id,
      scanFeedback: item.scan?.user_feedback,
      scanFeedbackVariety: item.scan?.feedback_variety,
      scanFeedbackAt: item.scan?.feedback_at,
      })),
      ...supportTickets.map((ticket) => ({
        id: `support:${ticket.id}`,
        type: 'support',
        user: ticket.user || 'Unknown user',
        predicted: 'Support Ticket',
        actual: ticket.subject,
        notes: ticket.message,
        confidence: null,
        reviewed: ticket.reviewed,
        createdAt: ticket.created_at,
        scanId: null,
        scanFeedback: 'support',
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 100),
  });
});

router.patch(
  '/feedback/:id',
  [body('reviewed').isBoolean()],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: errors.array() });
    }

    if (req.params.id.startsWith('support:')) {
      await ensureSupportTicketsTable();
      const ticketId = req.params.id.replace(/^support:/, '');
      await prisma.$executeRaw`UPDATE support_tickets SET reviewed = ${req.body.reviewed} WHERE id = ${ticketId}`;
      return res.json({ success: true, data: { id: req.params.id, reviewed: req.body.reviewed } });
    }

    const feedback = await prisma.ml_feedback.update({
      where: { id: req.params.id },
      data: { reviewed: req.body.reviewed },
    });

    res.json({ success: true, data: { id: feedback.id, reviewed: feedback.reviewed } });
  },
);

export default router;
