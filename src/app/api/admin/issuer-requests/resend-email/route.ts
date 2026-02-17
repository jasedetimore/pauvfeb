import { NextRequest, NextResponse } from "next/server";
import {
  createAdminClient,
  verifyAdmin,
  logAuditEntry,
  getClientIP,
  AdminOperationError,
} from "@/lib/supabase/admin";
import { getURL } from "@/lib/utils/get-url";

/**
 * POST /api/admin/issuer-requests/resend-email
 * Re-send the issuer approval email for an already-approved existing user.
 * Uses Supabase's magic_link template (auth.email.template.magic_link).
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    const adminClient = createAdminClient();

    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      throw new AdminOperationError("requestId is required", 400, "VALIDATION_ERROR");
    }

    // Fetch the issuer request
    const { data: issuerRequest, error: fetchError } = await adminClient
      .from("issuer_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !issuerRequest) {
      throw new AdminOperationError("Issuer request not found", 404, "NOT_FOUND");
    }

    if (issuerRequest.status !== "approved") {
      throw new AdminOperationError(
        "Can only resend email for approved requests",
        400,
        "NOT_APPROVED"
      );
    }

    if (!issuerRequest.user_id) {
      throw new AdminOperationError(
        "This request has no linked user. Use the invite flow instead.",
        400,
        "NO_USER"
      );
    }

    // Send magic link email via Supabase (uses auth.email.template.magic_link)
    const { error: otpError } = await adminClient.auth.signInWithOtp({
      email: issuerRequest.email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${getURL()}auth/issuer-approved`,
      },
    });

    if (otpError) {
      console.error("Failed to resend approval email:", otpError);
      throw new AdminOperationError(
        `Email send failed: ${otpError.message}`,
        500,
        "EMAIL_ERROR"
      );
    }

    // Audit log
    await logAuditEntry({
      adminId: admin.userId,
      action: "RESEND_ISSUER_APPROVAL_EMAIL",
      targetTable: "issuer_requests",
      targetId: requestId,
      metadata: { email: issuerRequest.email },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      data: { emailSent: true },
    });
  } catch (error) {
    if (error instanceof AdminOperationError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Resend approval email error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
