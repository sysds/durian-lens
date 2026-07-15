import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/prisma';
import { redis } from '../utils/redis';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

function generateTokens(userId: string, role: string, jti: string) {
  const accessToken = jwt.sign({ sub: userId, role, type: 'access' }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
  const refreshToken = jwt.sign({ sub: userId, role, jti, type: 'refresh' }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
  return { accessToken, refreshToken };
}

// ── POST /auth/register ──────────────────────────────────────
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('displayName').isLength({ min: 1, max: 100 }).trim(),
    body('role').optional().isIn(['user', 'seller', 'farmer']),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: errors.array() });
    }

    const { email, password, displayName, role = 'user' } = req.body;

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.users.create({
        data: { email, password_hash: passwordHash, display_name: displayName, role },
      });
      await tx.user_stats.create({ data: { user_id: newUser.id } });
      return newUser;
    });

    const tokenId = uuidv4();
    const { accessToken, refreshToken } = generateTokens(user.id, user.role, tokenId);

    const tokenHash = await bcrypt.hash(refreshToken, 8);
    await redis.setex(
      `refresh:${user.id}:${tokenId}`,
      REFRESH_TOKEN_TTL,
      JSON.stringify({ hash: tokenHash, deviceInfo: req.headers['user-agent'] }),
    );

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, displayName: user.display_name, role: user.role },
        accessToken,
        refreshToken,
      },
    });
  },
);

// ── POST /auth/login ─────────────────────────────────────────
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: errors.array() });
    }

    const { email, password } = req.body;

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user || !user.is_active) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const tokenId = uuidv4();
    const { accessToken, refreshToken } = generateTokens(user.id, user.role, tokenId);

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const tokenHash = await bcrypt.hash(refreshToken, 8);
    await redis.setex(
      `refresh:${user.id}:${tokenId}`,
      REFRESH_TOKEN_TTL,
      JSON.stringify({ hash: tokenHash, deviceInfo: req.headers['user-agent'] }),
    );

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, displayName: user.display_name, role: user.role },
        accessToken,
        refreshToken,
      },
    });
  },
);

router.post('/google',
  [body('accessToken').notEmpty()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', details: errors.array() });
    }

    const { accessToken: googleAccessToken } = req.body;
    let profile: any;
    try {
      const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
        timeout: 10000,
      });
      profile = data;
    } catch {
      throw new AppError('Google account verification failed', 401, 'GOOGLE_TOKEN_INVALID');
    }

    if (!profile?.email) {
      throw new AppError('Google account did not return an email address', 400, 'GOOGLE_EMAIL_MISSING');
    }

    const displayName = profile.name || profile.email;
    const passwordHash = await bcrypt.hash(`google:${profile.sub}:${profile.email}`, 12);

    const user = await prisma.$transaction(async (tx: any) => {
      const existing = await tx.users.findUnique({ where: { email: profile.email } });
      if (existing) {
        return tx.users.update({
          where: { id: existing.id },
          data: {
            display_name: existing.display_name || displayName,
            last_login_at: new Date(),
          },
        });
      }

      const newUser = await tx.users.create({
        data: {
          email: profile.email,
          password_hash: passwordHash,
          display_name: displayName,
          role: 'user',
          is_verified: !!profile.email_verified,
          last_login_at: new Date(),
        },
      });
      await tx.user_stats.create({ data: { user_id: newUser.id } });
      return newUser;
    });

    const tokenId = uuidv4();
    const { accessToken, refreshToken } = generateTokens(user.id, user.role, tokenId);
    const tokenHash = await bcrypt.hash(refreshToken, 8);
    await redis.setex(
      `refresh:${user.id}:${tokenId}`,
      REFRESH_TOKEN_TTL,
      JSON.stringify({ hash: tokenHash, deviceInfo: req.headers['user-agent'], provider: 'google' }),
    );

    logger.info(`Google user signed in: ${profile.email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /auth/refresh ───────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('Refresh token required', 400, 'MISSING_TOKEN');

  let payload: any;
  try {
    payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_TOKEN');
  }

  if (payload.type !== 'refresh') throw new AppError('Invalid token type', 401, 'INVALID_TOKEN');

  // Verify token exists in Redis (Revocation Check)
  const redisKey = `refresh:${payload.sub}:${payload.jti}`;
  const cached = await redis.get(redisKey);
  if (!cached) throw new AppError('Token revoked or expired', 401, 'INVALID_TOKEN');

  const { hash } = JSON.parse(cached);
  const isValid = await bcrypt.compare(refreshToken, hash);
  if (!isValid) throw new AppError('Invalid token', 401, 'INVALID_TOKEN');

  // Token Rotation: Invalidate old token and issue new one
  await redis.del(redisKey);

  const newTokenId = uuidv4();
  const role = payload.role || 'user';
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload.sub, role, newTokenId);

  const newTokenHash = await bcrypt.hash(newRefreshToken, 8);
  await redis.setex(
    `refresh:${payload.sub}:${newTokenId}`,
    REFRESH_TOKEN_TTL,
    JSON.stringify({ hash: newTokenHash }),
  );

  res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
});

// ── POST /auth/logout ────────────────────────────────────────
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  // Invalidate all refresh tokens for user
  const keys = await redis.keys(`refresh:${req.userId}:*`);
  if (keys.length > 0) await redis.del(...keys);

  res.json({ success: true, message: 'Logged out successfully' });
});

// ── GET /auth/me ─────────────────────────────────────────────
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
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
      role: user.role,
      isVerified: user.is_verified,
      stats: user.user_stats,
      createdAt: user.created_at,
    },
  });
});

export default router;
