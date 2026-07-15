import { Router, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import axios from 'axios';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/prisma';
import { uploadToS3, getSignedUrl, deleteFromS3 } from '../utils/s3';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
const router = Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://ml-service:8000';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

function getConfidenceLevel(confidence: number): string {
  if (confidence >= 0.85) return 'high';
  if (confidence >= 0.60) return 'medium';
  return 'low';
}

// ── POST /scan ───────────────────────────────────────────────
router.post('/', upload.single('image'), async (req: AuthRequest, res: Response) => {
  logger.info(`Scan request from user ${req.userId}, file: ${req.file?.originalname}, size: ${req.file?.size}`);

  if (!req.file) {
    throw new AppError('Image file is required', 400, 'MISSING_IMAGE');
  }

  const source = (req.body.source as string) || 'camera';
  const latitude = req.body.latitude ? parseFloat(req.body.latitude) : undefined;
  const longitude = req.body.longitude ? parseFloat(req.body.longitude) : undefined;

  // ── 1. Preprocess image ──────────────────────────────────
  let processedBuffer: Buffer;
  let metadata: sharp.Metadata;

  try {
    const sharpInst = sharp(req.file.buffer);
    metadata = await sharpInst.metadata();
    logger.info(`Image metadata: ${metadata.width}x${metadata.height} ${metadata.format}`);

    processedBuffer = await sharpInst
      .rotate()
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90, progressive: true })
      .toBuffer();
  } catch (err) {
    logger.error('Image processing error:', err);
    throw new AppError('Failed to process image', 422, 'IMAGE_PROCESS_ERROR');
  }

  // ── 2. Store image (local in dev, S3 in prod) ────────────
  const imageKey = `scans/${req.userId}/${uuidv4()}.jpg`;
  await uploadToS3(imageKey, processedBuffer, 'image/jpeg');

  // ── 3. Call ML service ───────────────────────────────────
  const mlStart = Date.now();
  let mlResult: {
    variety: string;
    confidence: number;
    probabilities: Record<string, number>;
    model_version: string;
  };

  try {
    const form = new FormData();
    form.append('image', processedBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });
    mlResult = mlResponse.data;
    logger.info(`ML result: ${mlResult.variety} (${(mlResult.confidence * 100).toFixed(1)}%)`);
  } catch (err: any) {
    logger.error('ML service error:', err.message);

    // In dev, return a mock result if ML is not available
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('ML service unavailable — using mock result for dev');
      const varieties = ['musang-king', 'black-thorn', 'd24'];
      const mockVariety = varieties[Math.floor(Math.random() * varieties.length)];
      mlResult = {
        variety: mockVariety,
        confidence: 0.85 + Math.random() * 0.12,
        probabilities: {
          'musang-king': mockVariety === 'musang-king' ? 0.90 : 0.05,
          'black-thorn': mockVariety === 'black-thorn' ? 0.90 : 0.05,
          'd24': mockVariety === 'd24' ? 0.90 : 0.05,
        },
        model_version: 'mock-1.0',
      };
    } else {
      throw new AppError('AI recognition service unavailable. Please try again.', 503, 'ML_SERVICE_ERROR');
    }
  }

  const processingMs = Date.now() - mlStart;
  const confidenceLevel = getConfidenceLevel(mlResult.confidence);

  // ── 4. Fetch variety metadata ────────────────────────────
  const variety = await prisma.varieties.findUnique({
    where: { slug: mlResult.variety },
    include: {
      variety_characteristics: { orderBy: { sort_order: 'asc' } },
    },
  });

  // ── 5. Save scan record ──────────────────────────────────
  const scan = await prisma.scans.create({
    data: {
      user_id: req.userId,
      image_key: imageKey,
      image_size_bytes: processedBuffer.length,
      image_width: metadata!.width,
      image_height: metadata!.height,
      predicted_variety: mlResult.variety,
      variety_id: variety?.id,
      confidence: mlResult.confidence,
      probabilities: mlResult.probabilities,
      confidence_level: confidenceLevel,
      processing_ms: processingMs,
      model_version: mlResult.model_version,
      source,
      latitude,
      longitude,
    },
  });

  // ── 6. Update user stats (fire and forget) ───────────────
  prisma.user_stats.upsert({
    where: { user_id: req.userId! },
    update: { total_scans: { increment: 1 }, last_scan_at: new Date(), updated_at: new Date() },
    create: { user_id: req.userId!, total_scans: 1, last_scan_at: new Date() },
  }).catch((err: any) => logger.error('Failed to update user stats:', err));

  // ── 7. Get image URL ─────────────────────────────────────
  const imageUrl = await getSignedUrl(imageKey);

  logger.info(`Scan complete: ${scan.id} -> ${mlResult.variety} in ${processingMs}ms`);

  res.status(201).json({
    success: true,
    data: {
      scan: {
        id: scan.id,
        imageUrl,
        source,
        createdAt: scan.created_at,
        userFeedback: scan.user_feedback,
      },
      result: {
        variety: mlResult.variety,
        confidence: mlResult.confidence,
        confidenceLevel,
        probabilities: mlResult.probabilities,
        processingMs,
        modelVersion: mlResult.model_version,
      },
      variety: variety ? {
        id: variety.id,
        slug: variety.slug,
        name: variety.name,
        description: variety.description,
        origin: variety.origin,
        season: variety.season,
        priceRange: variety.price_range,
        thumbnailUrl: variety.thumbnail_url,
        characteristics: variety.variety_characteristics,
      } : null,
    },
  });
});

// ── POST /scan/:id/feedback ──────────────────────────────────
router.post('/:id/feedback', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { feedback, actualVariety, notes } = req.body;

  if (!['correct', 'incorrect', 'unsure'].includes(feedback)) {
    throw new AppError('Invalid feedback value', 400, 'INVALID_FEEDBACK');
  }
  if (notes !== undefined && String(notes).length > 1000) {
    throw new AppError('Feedback notes must be 1000 characters or less', 400, 'INVALID_NOTES');
  }

  const scan = await prisma.scans.findFirst({ where: { id, user_id: req.userId } });
  if (!scan) throw new AppError('Scan not found', 404, 'NOT_FOUND');

  const cleanNotes = typeof notes === 'string' && notes.trim() ? notes.trim() : null;
  const cleanActual = typeof actualVariety === 'string' && actualVariety.trim() ? actualVariety.trim() : null;

  await prisma.scans.update({
    where: { id },
    data: { user_feedback: feedback, feedback_variety: cleanActual, feedback_at: new Date() },
  });

  await prisma.ml_feedback.deleteMany({ where: { scan_id: id, user_id: req.userId } });
  if (feedback !== 'correct' || cleanNotes) {
    await prisma.ml_feedback.create({
      data: {
        scan_id: id,
        user_id: req.userId,
        predicted: scan.predicted_variety!,
        actual: cleanActual,
        confidence: scan.confidence?.toNumber(),
        notes: cleanNotes,
      },
    });
  }

  res.json({ success: true, message: 'Feedback recorded. Thank you!' });
});

// ── DELETE /scan/:id ──────────────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const scan = await prisma.scans.findFirst({
    where: { id: req.params.id, user_id: req.userId },
    select: { id: true, image_key: true },
  });

  if (!scan) throw new AppError('Scan not found', 404, 'NOT_FOUND');

  await prisma.ml_feedback.deleteMany({ where: { scan_id: scan.id } });
  await prisma.scans.delete({ where: { id: scan.id } });

  deleteFromS3(scan.image_key).catch((err: any) => {
    logger.error(`Failed to delete scan image ${scan.image_key}:`, err);
  });

  Promise.all([
    prisma.scans.count({ where: { user_id: req.userId } }),
    prisma.scans.findFirst({
      where: { user_id: req.userId },
      orderBy: { created_at: 'desc' },
      select: { created_at: true },
    }),
  ])
    .then(([totalScans, latestScan]) =>
      prisma.user_stats.upsert({
        where: { user_id: req.userId! },
        update: {
          total_scans: totalScans,
          last_scan_at: latestScan?.created_at || null,
          updated_at: new Date(),
        },
        create: {
          user_id: req.userId!,
          total_scans: totalScans,
          last_scan_at: latestScan?.created_at || null,
        },
      }),
    )
    .catch((err: any) => logger.error('Failed to update user stats after delete:', err));

  res.json({ success: true, message: 'Scan deleted' });
});

// ── GET /scan/:id ────────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const scan = await prisma.scans.findFirst({
    where: { id: req.params.id, user_id: req.userId },
    include: {
      varieties: {
        include: { variety_characteristics: { orderBy: { sort_order: 'asc' } } },
      },
    },
  });

  if (!scan) throw new AppError('Scan not found', 404, 'NOT_FOUND');

  const imageUrl = await getSignedUrl(scan.image_key);
  const variety = scan.varieties;

  // Prisma returns snake_case decimals; frontend expects camelCase numbers
  const confidenceNum = (scan.confidence as any).toNumber
    ? (scan.confidence as any).toNumber()
    : Number(scan.confidence);

  res.json({
    success: true,
    data: {
      id: scan.id,
      imageUrl,
      predictedVariety: scan.predicted_variety,
      varietyName: variety?.name,
      confidence: confidenceNum,
      confidenceLevel: scan.confidence_level,
      probabilities: (scan.probabilities as Record<string, number>) || {},
      processingMs: scan.processing_ms,
      modelVersion: scan.model_version,
      source: scan.source,
      createdAt: scan.created_at,
      userFeedback: scan.user_feedback,
      variety: variety
        ? {
            id: variety.id,
            slug: variety.slug,
            name: variety.name,
            description: variety.description,
            origin: variety.origin,
            season: variety.season,
            priceRange: variety.price_range,
            thumbnailUrl: variety.thumbnail_url,
            characteristics: variety.variety_characteristics.map((c: any) => ({
              id: c.id,
              label: c.label,
              value: c.value,
              score: c.score,
            })),
          }
        : null,
    },
  });
});

export default router;
