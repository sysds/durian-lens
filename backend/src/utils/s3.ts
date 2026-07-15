import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';

const hasS3Creds = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.S3_BUCKET
);

const BUCKET = process.env.S3_BUCKET;
const localUploadDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(localUploadDir)) {
  fs.mkdirSync(localUploadDir, { recursive: true });
}

const s3 = hasS3Creds
  ? new S3Client({
      region: process.env.AWS_REGION || 'ap-southeast-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

function safeKey(key: string): string {
  const normalized = key.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.includes('..')) {
    throw new Error('Invalid upload key');
  }
  return normalized;
}

function localPathFromKey(key: string): string {
  return path.join(localUploadDir, safeKey(key));
}

function localUrlFromKey(key: string): string {
  return `/uploads/${safeKey(key)
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')}`;
}

export async function uploadToS3(key: string, buffer: Buffer, contentType: string): Promise<void> {
  if (!s3) {
    const localPath = localPathFromKey(key);
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    fs.writeFileSync(localPath, buffer);
    return;
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: safeKey(key),
      Body: buffer,
      ContentType: contentType,
    }),
  );
}

export async function getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  if (!s3) {
    const localPath = localPathFromKey(key);
    if (!fs.existsSync(localPath)) return '';
    return localUrlFromKey(key);
  }

  return awsGetSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: safeKey(key),
    }),
    { expiresIn },
  );
}

export async function deleteFromS3(key: string): Promise<void> {
  if (!s3) {
    const localPath = localPathFromKey(key);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    return;
  }

  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: safeKey(key),
    }),
  );
}
