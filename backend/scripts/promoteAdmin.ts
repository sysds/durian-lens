import dotenv from 'dotenv';
import { prisma } from '../src/utils/prisma';

dotenv.config();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://durian_user:devpassword@localhost:5432/durian_lens';
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error('Usage: npm run admin:promote -- user@example.com');
    process.exit(1);
  }

  const existing = await prisma.users.findUnique({
    where: { email },
    select: { email: true },
  });

  if (!existing) {
    const users = await prisma.users.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
      select: { email: true, display_name: true, role: true },
    });

    console.error(`No user found with email: ${email}`);
    if (users.length > 0) {
      console.error('\nRecent users in this database:');
      users.forEach((user) => {
        console.error(`- ${user.email} (${user.display_name || 'No name'}, ${user.role})`);
      });
    } else {
      console.error('No users exist yet. Register an account in the app first, then promote that email.');
    }
    process.exit(1);
  }

  const user = await prisma.users.update({
    where: { email },
    data: { role: 'admin' },
    select: { email: true, display_name: true, role: true },
  });

  console.log(`Promoted ${user.display_name || user.email} to ${user.role}.`);
}

main()
  .catch((err) => {
    console.error('Could not promote admin:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
