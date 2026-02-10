/**
 * Queue Processing API Endpoint
 * 
 * POST /api/queue/process - Process pending orders from the queue
 * 
 * This endpoint processes orders from the queue table. It can be called:
 * - Manually by admins
 * - By a cron job / scheduled task
 * - After a new order is placed (optional immediate processing)
 * 
 * Query parameters:
 * - all: Process all pending orders (default: false, process one)
 * 
 * Requires admin authentication or service role key.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminFromJWT } from "@/lib/supabase/admin";
import { timingSafeEqual } from "crypto";
import {
  processNextOrder,
  processAllPendingOrders,
  getPendingOrderCount,
} from "@/lib/trading";

/** Constant-time string comparison to prevent timing attacks */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// GET - Get queue status
export async function GET(request: NextRequest) {
  try {
    // Check for admin auth or API key
    const authHeader = request.headers.get("authorization");
    const apiKey = request.headers.get("x-api-key");

    // Validate authentication (constant-time comparison to prevent timing attacks)
    const expectedKey = process.env.QUEUE_PROCESSOR_API_KEY;
    const isValidApiKey = !!(apiKey && expectedKey && safeCompare(apiKey, expectedKey));
    if (!isValidApiKey) {
      try {
        await verifyAdminFromJWT(authHeader);
      } catch {
        return NextResponse.json(
          { error: "Unauthorized - Admin access required" },
          { status: 401 }
        );
      }
    }

    const pendingCount = await getPendingOrderCount();

    return NextResponse.json({
      success: true,
      pendingOrders: pendingCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting queue status:", error);
    return NextResponse.json(
      {
        error: "Failed to get queue status",
      },
      { status: 500 }
    );
  }
}

// POST - Process orders from the queue
export async function POST(request: NextRequest) {
  try {
    // Check for admin auth or API key
    const authHeader = request.headers.get("authorization");
    const apiKey = request.headers.get("x-api-key");

    // Validate authentication (constant-time comparison to prevent timing attacks)
    const expectedKeyPost = process.env.QUEUE_PROCESSOR_API_KEY;
    const isValidApiKeyPost = !!(apiKey && expectedKeyPost && safeCompare(apiKey, expectedKeyPost));
    if (!isValidApiKeyPost) {
      try {
        await verifyAdminFromJWT(authHeader);
      } catch {
        return NextResponse.json(
          { error: "Unauthorized - Admin access required" },
          { status: 401 }
        );
      }
    }

    // Check query parameter for processing mode
    const { searchParams } = new URL(request.url);
    const processAll = searchParams.get("all") === "true";

    if (processAll) {
      // Process all pending orders
      const results = await processAllPendingOrders();

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      return NextResponse.json({
        success: true,
        message: `Processed ${results.length} orders`,
        summary: {
          total: results.length,
          successful,
          failed,
        },
        results,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Process single order
      const result = await processNextOrder();

      if (!result) {
        return NextResponse.json({
          success: true,
          message: "No pending orders to process",
          timestamp: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        success: result.success,
        message: result.message,
        result,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error processing queue:", error);
    return NextResponse.json(
      {
        error: "Failed to process queue",
      },
      { status: 500 }
    );
  }
}
