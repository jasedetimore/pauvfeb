import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  verifyAdmin,
  logAuditEntry,
  getClientIP,
  AdminOperationError,
} from "@/lib/supabase/admin";

/**
 * GET /api/admin/tags
 * Fetch all tags with full details (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("tags")
      .select("*")
      .order("tag", { ascending: true });

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    await logAuditEntry({
      adminId: admin.userId,
      action: "READ_ALL",
      targetTable: "tags",
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
 * POST /api/admin/tags
 * Create a new tag (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const body = await request.json();
    const { tag, description, photo_url } = body;

    if (!tag || typeof tag !== "string" || tag.trim().length === 0) {
      throw new AdminOperationError(
        "Tag name is required",
        400,
        "VALIDATION_ERROR"
      );
    }

    const normalizedTag = tag.trim().toLowerCase();

    const adminClient = createAdminClient();

    // Check if tag already exists
    const { data: existing } = await adminClient
      .from("tags")
      .select("id")
      .eq("tag", normalizedTag)
      .single();

    if (existing) {
      throw new AdminOperationError(
        `Tag "${normalizedTag}" already exists`,
        409,
        "DUPLICATE_TAG"
      );
    }

    const { data, error } = await adminClient
      .from("tags")
      .insert({
        tag: normalizedTag,
        description: description?.trim() || null,
        photo_url: photo_url?.trim() || null,
        number_of_issuers: 0,
      })
      .select()
      .single();

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    await logAuditEntry({
      adminId: admin.userId,
      action: "CREATE",
      targetTable: "tags",
      targetId: data.id,
      metadata: { tag: normalizedTag },
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
 * PATCH /api/admin/tags
 * Update an existing tag (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const body = await request.json();
    const { id, description, photo_url } = body;

    if (!id) {
      throw new AdminOperationError(
        "Tag ID is required",
        400,
        "VALIDATION_ERROR"
      );
    }

    const adminClient = createAdminClient();

    // Build update object — only include fields that were provided
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }
    if (photo_url !== undefined) {
      updates.photo_url = photo_url?.trim() || null;
    }

    const { data, error } = await adminClient
      .from("tags")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    if (!data) {
      throw new AdminOperationError("Tag not found", 404, "NOT_FOUND");
    }

    await logAuditEntry({
      adminId: admin.userId,
      action: "UPDATE",
      targetTable: "tags",
      targetId: id,
      metadata: { updates },
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
