// src/routes/user.ts
import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// GET /users/me
router.get('/me', async (req: AuthRequest, res: Response) => {
  const user = await prisma.users.findUnique({
    where: { id: req.userId },
    include: { user_stats: true },
  });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      role: user.role,
      isVerified: user.is_verified,
      stats: user.user_stats,
      createdAt: user.created_at,
    },
  });
});

// PATCH /users/me
router.patch('/me',
  [
    body('displayName').optional().isLength({ min: 1, max: 100 }).trim(),
    body('avatarUrl').optional({ nullable: true }).isLength({ max: 500 }).trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: errors.array() });
    }

    const { displayName, avatarUrl } = req.body;
    const user = await prisma.users.update({
      where: { id: req.userId },
      data: {
        ...(displayName !== undefined ? { display_name: displayName } : {}),
        ...(avatarUrl !== undefined ? { avatar_url: avatarUrl || null } : {}),
      },
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        role: user.role,
      },
    });
  }
);

// POST /users/support-tickets
router.post('/support-tickets',
  [
    body('subject').isLength({ min: 3, max: 120 }).trim(),
    body('message').isLength({ min: 10, max: 2000 }).trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: errors.array() });
    }

    const ticketId = `DL-${uuidv4().slice(0, 8).toUpperCase()}`;
    logger.info('Support ticket submitted', {
      ticketId,
      userId: req.userId,
      subject: req.body.subject,
      message: req.body.message,
    });

    res.status(201).json({
      success: true,
      data: { ticketId },
      message: 'Support ticket submitted.',
    });
  }
);

export default router;
