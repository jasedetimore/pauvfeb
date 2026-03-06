import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  AdminOperationError,
} from "@/lib/supabase/admin";

/**
 * Verify that the user is an issuer by checking the JWT claims.
 * Returns issuer info if valid, throws otherwise.
 */
async function verifyIssuerFromJWT(
  authHeader: string | null
): Promise<{ userId: string; issuerId: string; email: string }> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AdminOperationError(
      "Missing or invalid authorization header",
      401,
      "AUTH_ERROR"
    );
  }

  const token = authHeader.replace("Bearer ", "");
  const adminClient = createAdminClient();

  const {
    data: { user },
    error,
  } = await adminClient.auth.getUser(token);

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
 * POST /api/issuer/upload
 * Upload an issuer profile image to Supabase Storage (issuer only)
 * Accepts multipart/form-data with a "file" field and optional "folder" field
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const issuer = await verifyIssuerFromJWT(authHeader);

    const body = await request.json();
    const { fileName, fileType, fileSize, folder = "issuers" } = body as {
      fileName: string;
      fileType: string;
      fileSize: number;
      folder?: string;
    };

    if (!fileName || !fileType || !fileSize) {
      throw new AdminOperationError(
        "Missing required fields: fileName, fileType, fileSize",
        400,
        "VALIDATION_ERROR"
      );
    }

    if (folder !== "issuers") {
      throw new AdminOperationError("Invalid upload folder", 400, "VALIDATION_ERROR");
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(fileType)) {
      throw new AdminOperationError(
        `Invalid file type: ${fileType}. Allowed: ${allowedTypes.join(", ")}`,
        400,
        "VALIDATION_ERROR"
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (fileSize > maxSize) {
      throw new AdminOperationError(
        `File too large: ${(fileSize / 1024 / 1024).toFixed(1)}MB. Max: 10MB`,
        400,
        "VALIDATION_ERROR"
      );
    }

    // Generate unique filename: folder/timestamp-originalname
    const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
    const sanitizedName = fileName
      .replace(/\.[^/.]+$/, "") // remove extension
      .replace(/[^a-zA-Z0-9-_]/g, "-") // sanitize
      .toLowerCase()
      .substring(0, 50);
    const timestamp = Date.now();
    const filePath = `${folder}/${timestamp}-${sanitizedName}.${ext}`;

    const adminClient = createAdminClient();

    // Create a signed upload URL so the client can upload directly to Supabase Storage
    const { data, error } = await adminClient.storage
      .from("images")
      .createSignedUploadUrl(filePath);

    if (error) {
      throw new AdminOperationError(
        `Failed to create upload URL: ${error.message}`,
        500,
        "STORAGE_ERROR"
      );
    }

    // Get public URL for the path (will be valid after upload completes)
    const { data: urlData } = adminClient.storage
      .from("images")
      .getPublicUrl(filePath);

    // Auto-link the future logo URL to the current issuer's profile
    const updateRes = await adminClient
      .from("issuer_details")
      .update({ logo_url: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq("issuer_id", issuer.issuerId);

    if (updateRes.error) {
      console.error(
        "[API Issuer Upload] Failed to auto-link logo:",
        updateRes.error.message
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: data.signedUrl,
        token: data.token,
        path: data.path,
        publicUrl: urlData.publicUrl,
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
      { status: 500 }
    );
  }
}