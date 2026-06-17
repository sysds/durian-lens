// src/utils/redis.ts
import Redis from 'ioredis';
import { logger } from './logger';

const globalForRedis = globalThis as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy: (times) => {
      if (times > 5) return null;
      return Math.min(times * 200, 2000);
    },
  });

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error:', err));
redis.on('disconnect', () => logger.warn('Redis disconnected'));

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;