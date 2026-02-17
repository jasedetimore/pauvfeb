import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  verifyAdmin,
  logAuditEntry,
  getClientIP,
  AdminOperationError,
} from "@/lib/supabase/admin";

/**
 * GET /api/admin/audit-logs
 * Fetch audit logs with optional filters (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const targetTable = searchParams.get("target_table");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const adminClient = createAdminClient();

    let query = adminClient
      .from("security_audit")
      .select("*", { count: "exact" })
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (action) {
      query = query.eq("action", action);
    }
    if (targetTable) {
      query = query.eq("target_table", targetTable);
    }
    if (startDate) {
      query = query.gte("timestamp", startDate);
    }
    if (endDate) {
      query = query.lte("timestamp", endDate);
    }

    const { data, count, error } = await query;

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: count ? offset + limit < count : false,
      },
    });
  } catch (error) {
    if (error instanceof AdminOperationError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    );
  }
}

/**
 * GET /api/admin/audit-logs/stats
 * Get audit log statistics (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const adminClient = createAdminClient();

    // Get action counts
    const { data: actionCounts, error: actionError } = await adminClient
      .from("security_audit")
      .select("action")
      .then((result) => {
        if (result.error) return result;
        
        const counts: Record<string, number> = {};
        result.data?.forEach((row) => {
          counts[row.action] = (counts[row.action] || 0) + 1;
        });
        return { data: counts, error: null };
      });

    if (actionError) {
      throw new AdminOperationError(actionError.message, 500, "DB_ERROR");
    }

    // Get table counts
    const { data: tableCounts, error: tableError } = await adminClient
      .from("security_audit")
      .select("target_table")
      .then((result) => {
        if (result.error) return result;
        
        const counts: Record<string, number> = {};
        result.data?.forEach((row) => {
          counts[row.target_table] = (counts[row.target_table] || 0) + 1;
        });
        return { data: counts, error: null };
      });

    if (tableError) {
      throw new AdminOperationError(tableError.message, 500, "DB_ERROR");
    }

    // Get recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCount, error: recentError } = await adminClient
      .from("security_audit")
      .select("*", { count: "exact", head: true })
      .gte("timestamp", yesterday);

    if (recentError) {
      throw new AdminOperationError(recentError.message, 500, "DB_ERROR");
    }

    return NextResponse.json({
      success: true,
      stats: {
        byAction: actionCounts,
        byTable: tableCounts,
        last24Hours: recentCount,
      },
    });
  } catch (error) {
    if (error instanceof AdminOperationError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    );
  }
}
