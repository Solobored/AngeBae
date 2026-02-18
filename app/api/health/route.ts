/**
 * GET /api/health
 * Health check endpoint that verifies all services
 */

import { NextResponse } from "next/server";
import { healthCheck as dbHealthCheck } from "@/lib/db";
import { healthCheck as minioHealthCheck } from "@/lib/minio";
import { healthCheck as redisHealthCheck } from "@/lib/jobs";

export async function GET() {
  try {
    // Run all health checks in parallel
    const [dbOk, minioOk, redisOk] = await Promise.all([
      dbHealthCheck(),
      minioHealthCheck(),
      redisHealthCheck(),
    ]);

    const allHealthy = dbOk && minioOk && redisOk;
    const statusCode = allHealthy ? 200 : 503;

    return NextResponse.json(
      {
        status: allHealthy ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        services: {
          database: dbOk ? "ok" : "down",
          storage: minioOk ? "ok" : "down",
          queue: redisOk ? "ok" : "down",
        },
      },
      { status: statusCode }
    );
  } catch (err) {
    console.error("Health check error:", err);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 500 }
    );
  }
}
