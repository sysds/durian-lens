// src/utils/prisma.ts
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

prisma.$on('error' as never, (e: any) => logger.error('Prisma error:', e));
prisma.$on('warn' as never, (e: any) => logger.warn('Prisma warn:', e));

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;