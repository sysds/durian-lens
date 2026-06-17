process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://durian_user:devpassword@localhost:5432/durian_lens';

import { prisma } from '../src/utils/prisma';

async function main() {
  const rows = await prisma.varieties.findMany({
    select: { slug: true, name: true, description: true, origin: true, season: true, price_range: true },
    orderBy: { name: 'asc' },
  });
  console.log('Total varieties in DB:', rows.length);
  rows.forEach((r: any) => {
    console.log(`${r.slug} | ${r.name} | desc:${r.description ? 'Y' : 'N'} | origin:${r.origin || '-'} | season:${r.season || '-'} | price:${r.price_range || '-'}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
