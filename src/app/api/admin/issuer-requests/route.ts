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
 * GET /api/admin/issuer-requests
 * Fetch all issuer requests (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("issuer_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new AdminOperationError(error.message, 500, "DB_ERROR");
    }

    await logAuditEntry({
      adminId: admin.userId,
      action: "READ_ALL",
      targetTable: "issuer_requests",
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
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }
}

/**
 * POST /api/admin/issuer-requests/approve
 * Approve an issuer request:
 *  1. Update request status to 'approved'
 *  2. Create the issuer in issuer_details (if not already created)
 *  3a. If requester was already a user (user_id set):
 *      - Link issuer_details.user_id directly
 *      - Set app_metadata { issuer: true, issuer_id }
 *      - No invite email needed
 *  3b. If requester is new (no user_id):
 *      - Create an invite record in issuer_invites
 *      - Send the Supabase invite email via auth.admin.inviteUserByEmail
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

    // 1. Fetch the issuer request
    const { data: issuerRequest, error: fetchError } = await adminClient
      .from("issuer_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !issuerRequest) {
      throw new AdminOperationError("Issuer request not found", 404, "NOT_FOUND");
    }

    if (issuerRequest.status === "approved") {
      throw new AdminOperationError("Request already approved", 400, "ALREADY_APPROVED");
    }

    // 2. Update the request status to 'approved'
    const { error: updateError } = await adminClient
      .from("issuer_requests")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (updateError) {
      throw new AdminOperationError(updateError.message, 500, "DB_ERROR");
    }

    // 3. Create the issuer in issuer_details
    const ticker = issuerRequest.desired_ticker.toUpperCase();

    // Check if ticker already exists
    const { data: existingIssuer } = await adminClient
      .from("issuer_details")
      .select("id")
      .eq("ticker", ticker)
      .single();

    let issuerId: string;

    if (existingIssuer) {
      issuerId = existingIssuer.id;
    } else {
      const { data: newIssuer, error: createError } = await adminClient
        .from("issuer_details")
        .insert({
          name: issuerRequest.name,
          ticker,
          bio: issuerRequest.message || null,
          headline: null,
          tag: null,
          photo: null,
          is_hidden: true,
        })
        .select("id")
        .single();

      if (createError || !newIssuer) {
        throw new AdminOperationError(
          createError?.message || "Failed to create issuer",
          500,
          "DB_ERROR"
        );
      }
      issuerId = newIssuer.id;
    }

    // Determine if this is an existing user (already had an account when they submitted)
    const existingUserId = issuerRequest.user_id as string | null;
    let emailSent = false;
    let emailError: string | null = null;
    let linkedExistingUser = false;

    if (existingUserId) {
      // ── EXISTING USER FLOW ──
      // Skip invite email. Directly link their account to the issuer.

      // Link user_id on issuer_details
      const { error: linkError } = await adminClient
        .from("issuer_details")
        .update({ user_id: existingUserId })
        .eq("id", issuerId);

      if (linkError) {
        console.error("Failed to link existing user to issuer:", linkError);
        throw new AdminOperationError(
          "Failed to link user to issuer record",
          500,
          "DB_ERROR"
        );
      }

      // Set app_metadata so the frontend detects issuer status
      const { error: metaError } = await adminClient.auth.admin.updateUserById(
        existingUserId,
        {
          app_metadata: {
            issuer: true,
            issuer_id: issuerId,
          },
        }
      );

      if (metaError) {
        console.error("Failed to set issuer app_metadata on existing user:", metaError);
        throw new AdminOperationError(
          "Failed to set issuer metadata on user",
          500,
          "DB_ERROR"
        );
      }

      linkedExistingUser = true;

      // ── SEND APPROVAL EMAIL via Supabase magic link ──
      // Uses the auth.email.template.magic_link template configured in Supabase
      // (which uses the project's Resend integration — no local API key needed).
      try {
        const { error: otpError } = await adminClient.auth.signInWithOtp({
          email: issuerRequest.email,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: `${getURL()}auth/issuer-approved`,
          },
        });

        if (otpError) {
          console.error("Failed to send approval magic link email:", otpError);
          emailError = otpError.message;
        } else {
          emailSent = true;
        }
      } catch (emailErr) {
        console.error("Approval email send error:", emailErr);
        emailError =
          emailErr instanceof Error ? emailErr.message : "Failed to send approval email";
      }
    } else {
      // ── NEW USER FLOW ──
      // Create invite record and send Supabase invite email

      // 4. Create invite record (upsert on email to handle re-sends)
      const { error: inviteError } = await adminClient
        .from("issuer_invites")
        .upsert(
          {
            email: issuerRequest.email,
            issuer_id: issuerId,
            token: crypto.randomUUID(),
            expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
            is_used: false,
          },
          { onConflict: "email" }
        );

      if (inviteError) {
        console.error("Failed to upsert issuer_invites:", inviteError);
        // Non-blocking — the invite email will still work
      }

      // 5. Send the invite email via Supabase Auth
      const { error: inviteEmailError } = await adminClient.auth.admin.inviteUserByEmail(
        issuerRequest.email,
        {
          redirectTo: `${getURL()}auth/confirm-invite`,
        }
      );

      emailSent = !inviteEmailError;
      emailError = inviteEmailError?.message || null;
      if (inviteEmailError) {
        console.error("inviteUserByEmail error:", inviteEmailError);
      }
    }

    // 6. Audit log
    await logAuditEntry({
      adminId: admin.userId,
      action: "APPROVE_ISSUER_REQUEST",
      targetTable: "issuer_requests",
      targetId: requestId,
      newValue: {
        issuer_id: issuerId,
        ticker,
        email: issuerRequest.email,
        existing_user: linkedExistingUser,
        email_sent: emailSent,
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      data: {
        issuerId,
        emailSent,
        emailError,
        linkedExistingUser,
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
    console.error("Approve issuer request error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
