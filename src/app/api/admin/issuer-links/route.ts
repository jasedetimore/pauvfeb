import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  verifyAdminFromJWT,
  logAuditEntry,
  getClientIP,
  AdminOperationError,
} from "@/lib/supabase/admin";
import { SocialPlatform, SOCIAL_PLATFORMS } from "@/lib/types/issuer-links";

const VALID_PLATFORM_KEYS = new Set<string>(SOCIAL_PLATFORMS.map((p) => p.key));

/**
 * GET /api/admin/issuer-links
 * - No params: List first 10 issuers
 * - ?search=QUERY: Search by ticker or name, return up to 10 matching issuers
 * - ?ticker=XXXX: Fetch full issuer links by ticker
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const admin = await verifyAdminFromJWT(authHeader);

    const adminClient = createAdminClient();
    const ticker = request.nextUrl.searchParams.get("ticker");
    const search = request.nextUrl.searchParams.get("search");

    // Mode 1: Fetch full issuer_links by ticker
    if (ticker) {
      const { data, error } = await adminClient
        .from("issuer_links")
        .select("*")
        .eq("ticker", ticker.toUpperCase())
        .single();

      if (error && error.code === "PGRST116") {
        throw new AdminOperationError(
          `No issuer links found for ticker "${ticker.toUpperCase()}"`,
          404,
          "NOT_FOUND"
        );
      }

      if (error) {
        throw new AdminOperationError(error.message, 500, "DB_ERROR");
      }

      await logAuditEntry({
        adminId: admin.userId,
        action: "READ",
        targetTable: "issuer_links",
        targetId: data.id,
        metadata: { ticker: ticker.toUpperCase() },
        ipAddress: getClientIP(request),
        userAgent: request.headers.get("user-agent"),
      });

      return NextResponse.json({ success: true, data });
    }

    // Mode 2: List or search issuers (ticker + name only)
    let query = adminClient
      .from("issuer_details")
      .select("ticker, name")
      .order("name", { ascending: true })
      .limit(10);

    if (search && search.trim()) {
      // Sanitize search input to prevent PostgREST filter injection
      const searchTerm = search.trim().replace(/[%_.,()]/g, "");
      if (searchTerm) {
        // Search by ticker (case-insensitive prefix) OR name (case-insensitive contains)
        query = query.or(
          `ticker.ilike.${searchTerm.toUpperCase()}%,name.ilike.%${searchTerm}%`
        );
      }
    }

    const { data: issuers, error: listError } = await query;

    if (listError) {
      throw new AdminOperationError(listError.message, 500, "DB_ERROR");
    }

    // No audit log for list operations
    return NextResponse.json({ success: true, data: issuers });
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
 * PATCH /api/admin/issuer-links
 * Update social media links for an issuer (admin only)
 * Body: { ticker: string, links: { platform: url, ... } }
 */
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const admin = await verifyAdminFromJWT(authHeader);

    const body = await request.json();
    const { ticker, links } = body;

    if (!ticker || typeof ticker !== "string") {
      throw new AdminOperationError(
        "Ticker is required",
        400,
        "VALIDATION_ERROR"
      );
    }

    if (!links || typeof links !== "object") {
      throw new AdminOperationError(
        "Links object is required",
        400,
        "VALIDATION_ERROR"
      );
    }

    // Build update object — only include valid platform fields
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    for (const [key, value] of Object.entries(links)) {
      if (VALID_PLATFORM_KEYS.has(key)) {
        const strValue = typeof value === "string" ? value.trim() : "";
        updates[key as SocialPlatform] = strValue || null;
      }
    }

    const adminClient = createAdminClient();

    // Verify the issuer_links row exists
    const { data: existing, error: findError } = await adminClient
      .from("issuer_links")
      .select("id")
      .eq("ticker", ticker.toUpperCase())
      .single();

    if (findError && findError.code === "PGRST116") {
      throw new AdminOperationError(
        `No issuer links found for ticker "${ticker.toUpperCase()}". The issuer may not exist.`,
        404,
        "NOT_FOUND"
      );
    }

    if (findError) {
      throw new AdminOperationError(findError.message, 500, "DB_ERROR");
    }

    const { data, error } = await adminClient
      .from("issuer_links")
      .update(updates)
      .eq("ticker", ticker.toUpperCase())
      .select()
      .single();

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    await logAuditEntry({
      adminId: admin.userId,
      action: "UPDATE",
      targetTable: "issuer_links",
      targetId: existing.id,
      metadata: { ticker: ticker.toUpperCase(), updatedFields: Object.keys(links) },
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
