import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  verifyAdmin,
  logAuditEntry,
  getClientIP,
  AdminOperationError,
} from "@/lib/supabase/admin";

/**
 * GET /api/admin/hide-issuer
 * Fetch all issuers with their details, trading status, and hidden flag.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const adminClient = createAdminClient();

    // Fetch all issuer_details with is_hidden flag
    const { data: issuers, error: issuerError } = await adminClient
      .from("issuer_details")
      .select("id, name, ticker, tag, photo, is_hidden")
      .order("name", { ascending: true });

    if (issuerError) {
      throw new AdminOperationError(issuerError.message, 500, "DB_ERROR");
    }

    // Fetch all trading tickers so we know which issuers are listed for trading
    const { data: tradingRows, error: tradingError } = await adminClient
      .from("issuer_trading")
      .select("ticker");

    if (tradingError) {
      throw new AdminOperationError(tradingError.message, 500, "DB_ERROR");
    }

    const tradingTickers = new Set(
      (tradingRows ?? []).map((r: { ticker: string }) => r.ticker)
    );

    // Merge: attach a `has_trading` boolean to each issuer
    const merged = (issuers ?? []).map(
      (issuer: {
        id: string;
        name: string;
        ticker: string;
        tag: string | null;
        photo: string | null;
        is_hidden: boolean;
      }) => ({
        ...issuer,
        has_trading: tradingTickers.has(issuer.ticker),
      })
    );

    await logAuditEntry({
      adminId: admin.userId,
      action: "READ_ALL",
      targetTable: "issuer_details",
      metadata: { context: "hide-issuer", count: merged.length },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ success: true, data: merged });
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
 * PATCH /api/admin/hide-issuer
 * Toggle the is_hidden flag for an issuer.
 * Body: { id: string, is_hidden: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const body = await request.json();
    const { id, is_hidden } = body;

    if (!id || typeof is_hidden !== "boolean") {
      throw new AdminOperationError(
        "id (string) and is_hidden (boolean) are required",
        400,
        "VALIDATION_ERROR"
      );
    }

    const adminClient = createAdminClient();

    // Get existing issuer for audit
    const { data: existing, error: fetchError } = await adminClient
      .from("issuer_details")
      .select("id, ticker, is_hidden")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      throw new AdminOperationError("Issuer not found", 404, "NOT_FOUND");
    }

    // Update the flag
    const { data, error } = await adminClient
      .from("issuer_details")
      .update({ is_hidden })
      .eq("id", id)
      .select("id, name, ticker, is_hidden")
      .single();

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    await logAuditEntry({
      adminId: admin.userId,
      action: "UPDATE",
      targetTable: "issuer_details",
      targetId: id,
      oldValue: { is_hidden: existing.is_hidden },
      newValue: { is_hidden },
      metadata: { ticker: existing.ticker, context: "hide-issuer" },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      data,
      message: `Issuer ${existing.ticker} ${is_hidden ? "hidden" : "unhidden"} successfully`,
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
