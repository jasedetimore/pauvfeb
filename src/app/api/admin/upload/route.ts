import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  verifyAdminFromJWT,
  logAuditEntry,
  getClientIP,
  AdminOperationError,
} from "@/lib/supabase/admin";

/**
 * POST /api/admin/upload
 * Upload an image to Supabase Storage (admin only)
 * Accepts multipart/form-data with a "file" field and optional "folder" field
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const admin = await verifyAdminFromJWT(authHeader);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      throw new AdminOperationError("No file provided", 400, "VALIDATION_ERROR");
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      throw new AdminOperationError(
        `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(", ")}`,
        400,
        "VALIDATION_ERROR"
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new AdminOperationError(
        `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB`,
        400,
        "VALIDATION_ERROR"
      );
    }

    // Generate unique filename: folder/timestamp-originalname
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, "") // remove extension
      .replace(/[^a-zA-Z0-9-_]/g, "-") // sanitize
      .toLowerCase()
      .substring(0, 50);
    const timestamp = Date.now();
    const filePath = `${folder}/${timestamp}-${sanitizedName}.${ext}`;

    const adminClient = createAdminClient();

    // Convert File to ArrayBuffer then to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await adminClient.storage
      .from("images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw new AdminOperationError(
        `Upload failed: ${error.message}`,
        500,
        "STORAGE_ERROR"
      );
    }

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from("images")
      .getPublicUrl(data.path);

    // Log the upload
    await logAuditEntry({
      adminId: admin.userId,
      action: "UPLOAD",
      targetTable: "storage.images",
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        storagePath: data.path,
        folder,
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent"),
    });

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
