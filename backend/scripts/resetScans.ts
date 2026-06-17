import { prisma } from '../src/utils/prisma';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://durian_user:devpassword@localhost:5432/durian_lens';
}

const uploadsDir = path.join(process.cwd(), 'uploads');
const backupDir = path.join(process.cwd(), `uploads_backup_${Date.now()}`);

async function resetScans() {
  console.log('Starting scan reset...\n');

  // 1. Backup and clear local image files
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir).filter((f) => f.endsWith('.jpg') || f.endsWith('.png'));
    if (files.length > 0) {
      fs.mkdirSync(backupDir, { recursive: true });
      for (const file of files) {
        fs.renameSync(path.join(uploadsDir, file), path.join(backupDir, file));
      }
      console.log(`Moved ${files.length} image(s) to backup:`);
      console.log(`  ${backupDir}\n`);
    } else {
      console.log('No image files found in uploads directory.\n');
    }
  } else {
    console.log('Uploads directory does not exist.\n');
  }

  // 2. Count records before deletion
  const scanCount = await prisma.scans.count();
  const feedbackCount = await prisma.ml_feedback.count();
  const statsCount = await prisma.user_stats.count();

  console.log(`Database records to clear:`);
  console.log(`  Scans: ${scanCount}`);
  console.log(`  ML Feedback: ${feedbackCount}`);
  console.log(`  User Stats: ${statsCount}\n`);

  // 3. Delete related records in correct order (foreign keys)
  const deletedFeedback = await prisma.ml_feedback.deleteMany({});
  console.log(`Deleted ${deletedFeedback.count} ML feedback record(s).`);

  const deletedScans = await prisma.scans.deleteMany({});
  console.log(`Deleted ${deletedScans.count} scan record(s).`);

  // 4. Reset user stats (set total_scans to 0, clear favorite_variety, etc.)
  const updatedStats = await prisma.user_stats.updateMany({
    data: {
      total_scans: 0,
      scans_today: 0,
      favorite_variety: null,
      accuracy_rate: null,
      streak_days: 0,
      last_scan_at: null,
    },
  });
  console.log(`Reset ${updatedStats.count} user stat record(s).\n`);

  console.log('Reset complete! All accounts now start fresh.');
  console.log(`If you need the old images back, they are in:\n  ${backupDir}`);
}

resetScans()
  .catch((err) => {
    console.error('Reset failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
