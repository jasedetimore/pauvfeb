import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  verifyAdminFromJWT,
  logAuditEntry,
  getClientIP,
  AdminOperationError,
} from "@/lib/supabase/admin";
import type { TransactionUpdate } from "@/lib/supabase/admin";

/**
 * GET /api/admin/transactions
 * Fetch all transactions with optional filters (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const admin = await verifyAdminFromJWT(authHeader);

    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");
    const userId = searchParams.get("user_id");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const adminClient = createAdminClient();

    let query = adminClient
      .from("transactions")
      .select("*", { count: "exact" })
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (ticker) {
      query = query.eq("ticker", ticker);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query;

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    // Log the read action
    await logAuditEntry({
      adminId: admin.userId,
      action: "READ_ALL",
      targetTable: "transactions",
      metadata: {
        count: data?.length || 0,
        total: count,
        filters: { ticker, userId, status },
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent"),
    });

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
 * POST /api/admin/transactions
 * Create a new transaction (admin only - for manual adjustments)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const admin = await verifyAdminFromJWT(authHeader);

    const body = await request.json();
    const {
      user_id,
      amount_usdp,
      ticker,
      order_type,
      avg_price_paid,
      pv_traded,
      start_price,
      end_price,
      status = "completed",
    } = body;

    // Validate required fields
    if (!user_id || !ticker || !order_type || amount_usdp === undefined) {
      throw new AdminOperationError(
        "Missing required fields: user_id, ticker, order_type, amount_usdp",
        400,
        "VALIDATION_ERROR"
      );
    }

    const adminClient = createAdminClient();

    const insertData = {
      user_id,
      amount_usdp,
      ticker,
      order_type,
      status,
      avg_price_paid: avg_price_paid ?? 0,
      pv_traded: pv_traded ?? 0,
      start_price: start_price ?? 0,
      end_price: end_price ?? 0,
      date: new Date().toISOString(),
    };

    const { data, error } = await adminClient
      .from("transactions")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    // Log the create action
    await logAuditEntry({
      adminId: admin.userId,
      action: "CREATE",
      targetTable: "transactions",
      targetId: data.id,
      newValue: insertData,
      metadata: { reason: "Manual admin adjustment" },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
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
 * PUT /api/admin/transactions
 * Update a transaction (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const admin = await verifyAdminFromJWT(authHeader);

    const body: TransactionUpdate = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      throw new AdminOperationError(
        "Transaction ID is required",
        400,
        "VALIDATION_ERROR"
      );
    }

    const adminClient = createAdminClient();

    // Get the old value first for audit logging
    const { data: oldData, error: fetchError } = await adminClient
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !oldData) {
      throw new AdminOperationError("Transaction not found", 404, "NOT_FOUND");
    }

    // Update the record
    const { data, error } = await adminClient
      .from("transactions")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    // Log the update action
    await logAuditEntry({
      adminId: admin.userId,
      action: "UPDATE",
      targetTable: "transactions",
      targetId: id,
      oldValue: oldData,
      newValue: data,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ success: true, data });
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
 * DELETE /api/admin/transactions
 * Delete a transaction (admin only - use with extreme caution)
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const admin = await verifyAdminFromJWT(authHeader);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      throw new AdminOperationError(
        "Transaction ID is required",
        400,
        "VALIDATION_ERROR"
      );
    }

    const adminClient = createAdminClient();

    // Get the old value first for audit logging
    const { data: oldData, error: fetchError } = await adminClient
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !oldData) {
      throw new AdminOperationError("Transaction not found", 404, "NOT_FOUND");
    }

    // Delete the record
    const { error } = await adminClient
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    // Log the delete action
    await logAuditEntry({
      adminId: admin.userId,
      action: "DELETE",
      targetTable: "transactions",
      targetId: id,
      oldValue: oldData,
      metadata: { warning: "Transaction permanently deleted" },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      message: `Deleted transaction ${id}`,
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
