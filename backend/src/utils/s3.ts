import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';

const isDev = process.env.NODE_ENV === 'development';
const hasS3Creds = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

const localUploadDir = path.join(process.cwd(), 'uploads');
if (isDev && !fs.existsSync(localUploadDir)) {
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

const BUCKET = process.env.S3_BUCKET;

function localPathFromKey(key: string): string {
  const safeKey = key.replace(/[/\\]/g, '_');
  return path.join(localUploadDir, safeKey);
}

export async function uploadToS3(key: string, buffer: Buffer, contentType: string): Promise<void> {
  if (isDev && !s3) {
    const localPath = localPathFromKey(key);
    fs.writeFileSync(localPath, buffer);
    return;
  }
  if (!s3) throw new Error('S3 is not configured');
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ServerSideEncryption: 'AES256',
  }));
}

export async function getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  if (isDev && !s3) {
    const localPath = localPathFromKey(key);
    if (!fs.existsSync(localPath)) return '';
    return `/uploads/${path.basename(localPath)}`;
  }
  if (!s3) throw new Error('S3 is not configured');
  const command = new GetObjectCommand({ Bucket: BUCKET!, Key: key });
  return awsGetSignedUrl(s3, command, { expiresIn });
}

export async function deleteFromS3(key: string): Promise<void> {
  if (isDev && !s3) {
    const localPath = localPathFromKey(key);
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    return;
  }
  if (!s3) throw new Error('S3 is not configured');
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET!, Key: key }));
}
