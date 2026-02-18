import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  verifyAdmin,
  logAuditEntry,
  getClientIP,
  AdminOperationError,
} from "@/lib/supabase/admin";

/**
 * POST /api/admin/upload
 * Creates a signed upload URL for direct client-to-Supabase uploads (admin only).
 * This avoids sending the file binary through the Next.js server, which
 * hits body-size limits on AWS Amplify / CloudFront / Cloudflare.
 *
 * Request JSON body: { fileName: string, fileType: string, fileSize: number, folder?: string }
 * Response JSON:     { success, data: { signedUrl, token, path, publicUrl } }
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    const body = await request.json();
    const { fileName, fileType, fileSize, folder = "general" } = body as {
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

    // Log the upload intent
    await logAuditEntry({
      adminId: admin.userId,
      action: "UPLOAD",
      targetTable: "storage.images",
      metadata: {
        fileName,
        fileSize,
        fileType,
        storagePath: filePath,
        folder,
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent"),
    });

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
