/**
 * MinIO S3-compatible Storage Client
 * Handles file uploads, downloads, and presigned URLs
 */

import { Client as MinIOClient } from 'minio';

let minioClient: MinIOClient | null = null;

/**
 * Initialize and return MinIO client
 */
export function getMinIOClient(): MinIOClient {
  if (!minioClient) {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost:9000';
    const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
    const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
    const useSSL = endpoint.startsWith('https');

    minioClient = new MinIOClient({
      endPoint: endpoint.replace(/^https?:\/\//, ''),
      accessKey,
      secretKey,
      useSSL,
    });
  }

  return minioClient;
}

/**
 * Ensure bucket exists, create if not
 */
export async function ensureBucket(bucketName: string): Promise<void> {
  const client = getMinIOClient();
  const exists = await client.bucketExists(bucketName);
  
  if (!exists) {
    await client.makeBucket(bucketName, 'us-east-1');
    console.log(`Created bucket: ${bucketName}`);
  }
}

/**
 * Upload file to MinIO
 */
export async function uploadFile(
  bucketName: string,
  objectName: string,
  fileBuffer: Buffer,
  metaData?: Record<string, string>
): Promise<{ objectName: string; etag: string }> {
  const client = getMinIOClient();
  await ensureBucket(bucketName);

  const result = await client.putObject(
    bucketName,
    objectName,
    fileBuffer,
    fileBuffer.length,
    metaData
  );

  return {
    objectName,
    etag: result.etag,
  };
}

/**
 * Get presigned download URL
 */
export async function getPresignedUrl(
  bucketName: string,
  objectName: string,
  expirySeconds: number = 3600
): Promise<string> {
  const client = getMinIOClient();
  return client.presignedGetObject(bucketName, objectName, expirySeconds);
}

/**
 * Get presigned upload URL
 */
export async function getPresignedUploadUrl(
  bucketName: string,
  objectName: string,
  expirySeconds: number = 3600
): Promise<string> {
  const client = getMinIOClient();
  return client.presignedPutObject(bucketName, objectName, expirySeconds);
}

/**
 * Delete file from MinIO
 */
export async function deleteFile(
  bucketName: string,
  objectName: string
): Promise<void> {
  const client = getMinIOClient();
  await client.removeObject(bucketName, objectName);
}

/**
 * List objects in bucket
 */
export async function listObjects(
  bucketName: string,
  prefix: string = '',
  recursive: boolean = false
): Promise<any[]> {
  const client = getMinIOClient();
  const objects: any[] = [];

  const stream = client.listObjects(bucketName, prefix, recursive);

  return new Promise((resolve, reject) => {
    stream.on('data', (obj) => objects.push(obj));
    stream.on('error', reject);
    stream.on('end', () => resolve(objects));
  });
}

/**
 * Health check: verify MinIO connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const client = getMinIOClient();
    const buckets = await client.listBuckets();
    return Array.isArray(buckets);
  } catch (err) {
    console.error('MinIO health check failed:', err);
    return false;
  }
}
