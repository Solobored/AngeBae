/**
 * Job Queue Utility using Redis and BullMQ
 * Manages async jobs like OCR processing
 */

import Queue from 'bull';
import redis from 'redis';

let ocrQueue: Queue.Queue | null = null;

/**
 * Initialize OCR job queue
 */
export function getOCRQueue(): Queue.Queue {
  if (!ocrQueue) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    ocrQueue = new Queue('ocr-jobs', redisUrl, {
      settings: {
        lockDuration: 30000,
        lockRenewTime: 15000,
        maxStalledCount: 2,
        maxStalledInterval: 5000,
        stalledInterval: 5000,
        retryProcessDelay: 5000,
        guardian: false,
        retryProcessDelay: 5000,
        guardianInterval: undefined,
        dequeueConcurrency: undefined,
        enableOfflineQueue: true,
      },
    });

    // Event handlers
    ocrQueue.on('completed', (job) => {
      console.log(`Job ${job.id} completed`);
    });

    ocrQueue.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed:`, err.message);
    });

    ocrQueue.on('error', (err) => {
      console.error('Queue error:', err);
    });
  }

  return ocrQueue;
}

/**
 * Add OCR job to queue
 */
export async function enqueueOCRJob(
  mediaid: string,
  ocrJobId: string,
  fileUrl: string,
  fileType: string = 'pdf'
): Promise<Queue.Job> {
  const queue = getOCRQueue();

  const job = await queue.add(
    {
      mediaId: mediaid,
      ocrJobId,
      fileUrl,
      fileType,
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  return job;
}

/**
 * Get job by ID
 */
export async function getJob(jobId: number): Promise<Queue.Job | null> {
  const queue = getOCRQueue();
  return queue.getJob(jobId);
}

/**
 * Get job state  
 */
export async function getJobState(jobId: number): Promise<string | null> {
  const queue = getOCRQueue();
  const job = await queue.getJob(jobId);
  
  if (!job) return null;
  
  return job.getState();
}

/**
 * Get job progress
 */
export async function getJobProgress(jobId: number): Promise<number | null> {
  const queue = getOCRQueue();
  const job = await queue.getJob(jobId);
  
  if (!job) return null;
  
  return job.progress();
}

/**
 * Get job result
 */
export async function getJobResult(jobId: number): Promise<any | null> {
  const queue = getOCRQueue();
  const job = await queue.getJob(jobId);
  
  if (!job) return null;
  
  // Result is stored after completion
  return job.data?.result || null;
}

/**
 * Remove job
 */
export async function removeJob(jobId: number): Promise<number> {
  const queue = getOCRQueue();
  const job = await queue.getJob(jobId);
  
  if (!job) return 0;
  
  await job.remove();
  return 1;
}

/**
 * Get queue counts
 */
export async function getQueueCounts(): Promise<{
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const queue = getOCRQueue();
  
  const [activeCount, waitingCount, completedCount, failedCount, delayedCount] = await Promise.all([
    queue.getActiveCount(),
    queue.getWaitingCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    active: activeCount,
    waiting: waitingCount,
    completed: completedCount,
    failed: failedCount,
    delayed: delayedCount,
  };
}

/**
 * Health check: verify Redis connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const client = redis.createClient({ url: redisUrl });
    
    await client.connect();
    await client.ping();
    await client.disconnect();
    
    return true;
  } catch (err) {
    console.error('Redis health check failed:', err);
    return false;
  }
}

/**
 * Close queue
 */
export async function closeQueue(): Promise<void> {
  if (ocrQueue) {
    await ocrQueue.close();
    ocrQueue = null;
  }
}
