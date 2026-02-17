import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  verifyAdmin,
  logAuditEntry,
  getClientIP,
  AdminOperationError,
} from "@/lib/supabase/admin";
import type { IssuerTradingUpdate } from "@/lib/supabase/admin";

/**
 * GET /api/admin/issuer-trading
 * Fetch all issuer trading records (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("issuer_trading")
      .select("*")
      .order("ticker", { ascending: true });

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    // Log the read action
    await logAuditEntry({
      adminId: admin.userId,
      action: "READ_ALL",
      targetTable: "issuer_trading",
      metadata: { count: data?.length || 0 },
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
 * POST /api/admin/issuer-trading
 * Create a new issuer trading record (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const body = await request.json();
    const { ticker, base_price, price_step, current_price, current_supply, total_usdp } = body;

    if (!ticker) {
      throw new AdminOperationError("Ticker is required", 400, "VALIDATION_ERROR");
    }

    const adminClient = createAdminClient();

    const insertData = {
      ticker,
      base_price: base_price ?? 1.0,
      price_step: price_step ?? 0.01,
      current_price: current_price ?? 1.0,
      current_supply: current_supply ?? 0,
      total_usdp: total_usdp ?? 0,
    };

    const { data, error } = await adminClient
      .from("issuer_trading")
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
      targetTable: "issuer_trading",
      targetId: ticker,
      newValue: insertData,
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
 * PUT /api/admin/issuer-trading
 * Update an issuer trading record (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const body: IssuerTradingUpdate = await request.json();
    const { ticker, ...updateFields } = body;

    if (!ticker) {
      throw new AdminOperationError("Ticker is required", 400, "VALIDATION_ERROR");
    }

    const adminClient = createAdminClient();

    // Get the old value first for audit logging
    const { data: oldData, error: fetchError } = await adminClient
      .from("issuer_trading")
      .select("*")
      .eq("ticker", ticker)
      .single();

    if (fetchError || !oldData) {
      throw new AdminOperationError("Record not found", 404, "NOT_FOUND");
    }

    // Update the record
    const { data, error } = await adminClient
      .from("issuer_trading")
      .update(updateFields)
      .eq("ticker", ticker)
      .select()
      .single();

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    // Log the update action
    await logAuditEntry({
      adminId: admin.userId,
      action: "UPDATE",
      targetTable: "issuer_trading",
      targetId: ticker,
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
 * DELETE /api/admin/issuer-trading
 * Delete an issuer trading record (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");

    if (!ticker) {
      throw new AdminOperationError("Ticker is required", 400, "VALIDATION_ERROR");
    }

    const adminClient = createAdminClient();

    // Get the old value first for audit logging
    const { data: oldData, error: fetchError } = await adminClient
      .from("issuer_trading")
      .select("*")
      .eq("ticker", ticker)
      .single();

    if (fetchError || !oldData) {
      throw new AdminOperationError("Record not found", 404, "NOT_FOUND");
    }

    // Delete the record
    const { error } = await adminClient
      .from("issuer_trading")
      .delete()
      .eq("ticker", ticker);

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    // Log the delete action
    await logAuditEntry({
      adminId: admin.userId,
      action: "DELETE",
      targetTable: "issuer_trading",
      targetId: ticker,
      oldValue: oldData,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ success: true, message: `Deleted ${ticker}` });
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
