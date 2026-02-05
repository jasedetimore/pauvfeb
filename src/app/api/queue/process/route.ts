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
import {
  processNextOrder,
  processAllPendingOrders,
  getPendingOrderCount,
} from "@/lib/trading";

// GET - Get queue status
export async function GET(request: NextRequest) {
  try {
    // Check for admin auth or API key
    const authHeader = request.headers.get("authorization");
    const apiKey = request.headers.get("x-api-key");

    // Validate authentication
    if (apiKey !== process.env.QUEUE_PROCESSOR_API_KEY) {
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
        message: error instanceof Error ? error.message : "Unknown error",
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

    // Validate authentication
    if (apiKey !== process.env.QUEUE_PROCESSOR_API_KEY) {
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
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
