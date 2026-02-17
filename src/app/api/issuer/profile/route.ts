import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  AdminOperationError,
} from "@/lib/supabase/admin";
import { SocialPlatform, SOCIAL_PLATFORMS } from "@/lib/types/issuer-links";

const VALID_PLATFORM_KEYS = new Set<string>(SOCIAL_PLATFORMS.map((p) => p.key));

/**
 * Verify that the user is an issuer by checking the JWT claims.
 * Returns issuer info if valid, throws otherwise.
 */
async function verifyIssuerFromJWT(
  authHeader: string | null
): Promise<{ userId: string; issuerId: string; email: string }> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AdminOperationError("Missing or invalid authorization header", 401, "AUTH_ERROR");
  }

  const token = authHeader.replace("Bearer ", "");
  const adminClient = createAdminClient();

  const { data: { user }, error } = await adminClient.auth.getUser(token);

  if (error || !user) {
    throw new AdminOperationError("Invalid or expired token", 401, "AUTH_ERROR");
  }

  const isIssuer = user.app_metadata?.issuer === true;
  const issuerId = user.app_metadata?.issuer_id;

  if (!isIssuer || !issuerId) {
    throw new AdminOperationError("User is not an issuer", 403, "FORBIDDEN");
  }

  return {
    userId: user.id,
    issuerId,
    email: user.email || "unknown",
  };
}

/**
 * GET /api/issuer/profile
 * Fetch the authenticated issuer's own details + links
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const issuer = await verifyIssuerFromJWT(authHeader);

    const adminClient = createAdminClient();

    // Fetch issuer details
    const { data: details, error: detailsError } = await adminClient
      .from("issuer_details")
      .select("*")
      .eq("id", issuer.issuerId)
      .single();

    if (detailsError || !details) {
      throw new AdminOperationError("Issuer profile not found", 404, "NOT_FOUND");
    }

    // Verify the user_id matches (extra security)
    if (details.user_id !== issuer.userId) {
      throw new AdminOperationError("Issuer profile mismatch", 403, "FORBIDDEN");
    }

    // Fetch issuer links
    const { data: links } = await adminClient
      .from("issuer_links")
      .select("*")
      .eq("ticker", details.ticker)
      .single();

    // Fetch tags for the dropdown
    const { data: tags } = await adminClient
      .from("tags")
      .select("id, tag")
      .order("tag", { ascending: true });

    return NextResponse.json({
      success: true,
      data: {
        details,
        links: links || null,
        tags: tags || [],
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
 * PATCH /api/issuer/profile
 * Update the authenticated issuer's own details and/or links
 * Body: {
 *   details?: { name, headline, bio, tag, photo }  (ticker excluded)
 *   links?: { instagram, tiktok, ... }
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const issuer = await verifyIssuerFromJWT(authHeader);

    const body = await request.json();
    const { details: detailsUpdate, links: linksUpdate } = body;

    const adminClient = createAdminClient();

    // Verify issuer owns this record
    const { data: existing, error: fetchError } = await adminClient
      .from("issuer_details")
      .select("*")
      .eq("id", issuer.issuerId)
      .single();

    if (fetchError || !existing) {
      throw new AdminOperationError("Issuer profile not found", 404, "NOT_FOUND");
    }

    if (existing.user_id !== issuer.userId) {
      throw new AdminOperationError("Issuer profile mismatch", 403, "FORBIDDEN");
    }

    let updatedDetails = existing;
    let updatedLinks = null;

    // Update issuer_details if provided
    if (detailsUpdate && typeof detailsUpdate === "object") {
      // Only allow specific fields — ticker, id, user_id, created_at are NOT editable
      const allowedFields: Record<string, unknown> = {};
      const editableKeys = ["name", "headline", "bio", "tag", "photo"];
      for (const key of editableKeys) {
        if (key in detailsUpdate) {
          const value = detailsUpdate[key];
          allowedFields[key] = typeof value === "string" && value.trim() ? value.trim() : null;
        }
      }

      // Name is required
      if ("name" in allowedFields && !allowedFields.name) {
        throw new AdminOperationError("Name is required", 400, "VALIDATION_ERROR");
      }

      if (Object.keys(allowedFields).length > 0) {
        allowedFields.updated_at = new Date().toISOString();

        const { data, error } = await adminClient
          .from("issuer_details")
          .update(allowedFields)
          .eq("id", issuer.issuerId)
          .select()
          .single();

        if (error) {
          throw new AdminOperationError(error.message, 500, "DB_ERROR");
        }

        updatedDetails = data;
      }
    }

    // Update issuer_links if provided
    if (linksUpdate && typeof linksUpdate === "object") {
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      for (const [key, value] of Object.entries(linksUpdate)) {
        if (VALID_PLATFORM_KEYS.has(key)) {
          const strValue = typeof value === "string" ? value.trim() : "";
          updates[key as SocialPlatform] = strValue || null;
        }
      }

      const { data, error } = await adminClient
        .from("issuer_links")
        .update(updates)
        .eq("ticker", existing.ticker)
        .select()
        .single();

      if (error) {
        throw new AdminOperationError(error.message, 500, "DB_ERROR");
      }

      updatedLinks = data;
    }

    return NextResponse.json({
      success: true,
      data: {
        details: updatedDetails,
        links: updatedLinks,
      },
      message: "Profile updated successfully",
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
