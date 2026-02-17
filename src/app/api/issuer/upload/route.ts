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
    await verifyIssuerFromJWT(authHeader);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "issuers";

    if (!file) {
      throw new AdminOperationError("No file provided", 400, "VALIDATION_ERROR");
    }

    if (folder !== "issuers") {
      throw new AdminOperationError("Invalid upload folder", 400, "VALIDATION_ERROR");
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      throw new AdminOperationError(
        `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(", ")}`,
        400,
        "VALIDATION_ERROR"
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new AdminOperationError(
        `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB`,
        400,
        "VALIDATION_ERROR"
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase()
      .substring(0, 50);
    const timestamp = Date.now();
    const filePath = `${folder}/${timestamp}-${sanitizedName}.${ext}`;

    const adminClient = createAdminClient();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await adminClient.storage
      .from("images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw new AdminOperationError(`Upload failed: ${error.message}`, 500, "STORAGE_ERROR");
    }

    const { data: urlData } = adminClient.storage
      .from("images")
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      data: {
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