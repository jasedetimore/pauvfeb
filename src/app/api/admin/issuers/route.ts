import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  verifyAdmin,
  logAuditEntry,
  getClientIP,
  AdminOperationError,
} from "@/lib/supabase/admin";

/**
 * GET /api/admin/issuers
 * Fetch all issuer details (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("issuer_details")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    // Log the read action
    await logAuditEntry({
      adminId: admin.userId,
      action: "READ_ALL",
      targetTable: "issuer_details",
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
 * POST /api/admin/issuers
 * Create a new issuer (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const body = await request.json();
    const { name, ticker, bio, headline, tag, photo } = body;

    // Validation
    if (!name || !ticker) {
      throw new AdminOperationError(
        "Name and ticker are required",
        400,
        "VALIDATION_ERROR"
      );
    }

    // Validate ticker format (uppercase letters only, 2-10 chars)
    if (!/^[A-Z0-9]{2,10}$/.test(ticker)) {
      throw new AdminOperationError(
        "Ticker must be 2-10 uppercase letters",
        400,
        "VALIDATION_ERROR"
      );
    }

    const adminClient = createAdminClient();

    // Check if ticker already exists
    const { data: existingIssuer } = await adminClient
      .from("issuer_details")
      .select("id")
      .eq("ticker", ticker)
      .single();

    if (existingIssuer) {
      throw new AdminOperationError(
        `Ticker ${ticker} already exists`,
        409,
        "DUPLICATE_TICKER"
      );
    }

    // Insert new issuer
    const insertData = {
      name,
      ticker: ticker.toUpperCase(),
      bio: bio || null,
      headline: headline || null,
      tag: tag || null,
      photo: photo || null,
    };

    const { data, error } = await adminClient
      .from("issuer_details")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    // Log the creation
    await logAuditEntry({
      adminId: admin.userId,
      action: "CREATE",
      targetTable: "issuer_details",
      targetId: data.id,
      newValue: insertData,
      metadata: { ticker },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      data,
      message: `Issuer ${ticker} created successfully`,
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
 * PATCH /api/admin/issuers
 * Update an issuer (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const body = await request.json();
    const { id } = body;

    if (!id) {
      throw new AdminOperationError(
        "Issuer ID is required",
        400,
        "VALIDATION_ERROR"
      );
    }

    // Whitelist: only allow safe fields to be updated
    const ALLOWED_UPDATE_KEYS = ["name", "bio", "headline", "tag", "photo"] as const;
    const updateFields: Record<string, unknown> = {};
    for (const key of ALLOWED_UPDATE_KEYS) {
      if (key in body) {
        updateFields[key] = body[key];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      throw new AdminOperationError(
        "No valid fields to update",
        400,
        "VALIDATION_ERROR"
      );
    }

    const adminClient = createAdminClient();

    // Get existing issuer for audit log
    const { data: existingIssuer, error: fetchError } = await adminClient
      .from("issuer_details")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingIssuer) {
      throw new AdminOperationError("Issuer not found", 404, "NOT_FOUND");
    }

    // Update issuer with only whitelisted fields
    const { data, error } = await adminClient
      .from("issuer_details")
      .update(updateFields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    // Log the update
    await logAuditEntry({
      adminId: admin.userId,
      action: "UPDATE",
      targetTable: "issuer_details",
      targetId: id,
      oldValue: existingIssuer,
      newValue: data,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      data,
      message: "Issuer updated successfully",
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
 * DELETE /api/admin/issuers
 * Delete an issuer (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      throw new AdminOperationError(
        "Issuer ID is required",
        400,
        "VALIDATION_ERROR"
      );
    }

    const adminClient = createAdminClient();

    // Get existing issuer for audit log
    const { data: existingIssuer, error: fetchError } = await adminClient
      .from("issuer_details")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingIssuer) {
      throw new AdminOperationError("Issuer not found", 404, "NOT_FOUND");
    }

    // Delete issuer
    const { error } = await adminClient
      .from("issuer_details")
      .delete()
      .eq("id", id);

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    // Log the deletion
    await logAuditEntry({
      adminId: admin.userId,
      action: "DELETE",
      targetTable: "issuer_details",
      targetId: id,
      oldValue: existingIssuer,
      metadata: { ticker: existingIssuer.ticker },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      message: `Issuer ${existingIssuer.ticker} deleted successfully`,
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
