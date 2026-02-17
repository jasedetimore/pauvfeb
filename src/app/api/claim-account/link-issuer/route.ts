import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/claim-account/link-issuer
 *
 * Links an authenticated user (auth.uid) to their issuer_details record
 * by matching on email. Also marks the issuer_invites record as used.
 *
 * Uses the service_role client to bypass RLS.
 * Called from SetPasswordForm after password is set.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, error: "userId and email are required" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 1. Find the issuer_invites record for this email to get the issuer_id
    const { data: invite } = await adminClient
      .from("issuer_invites")
      .select("id, issuer_id, is_used")
      .eq("email", email)
      .single();

    if (invite && !invite.is_used) {
      // Link user_id to issuer_details
      const { error: linkError } = await adminClient
        .from("issuer_details")
        .update({ user_id: userId })
        .eq("id", invite.issuer_id);

      if (linkError) {
        console.error("Failed to link user to issuer via invite:", linkError);
      }

      // Set app_metadata so the frontend can detect issuer status
      const { error: metaError } = await adminClient.auth.admin.updateUserById(userId, {
        app_metadata: {
          issuer: true,
          issuer_id: invite.issuer_id,
        },
      });

      if (metaError) {
        console.error("Failed to set issuer app_metadata:", metaError);
      }

      // Mark invite as used
      await adminClient
        .from("issuer_invites")
        .update({ is_used: true })
        .eq("id", invite.id);
    } else {
      // Fallback: try to match by email in issuer_requests → issuer_details
      const { data: issuerRequest } = await adminClient
        .from("issuer_requests")
        .select("desired_ticker")
        .eq("email", email)
        .eq("status", "approved")
        .single();

      if (issuerRequest) {
        // Look up the issuer_details id for metadata
        const { data: issuerRecord } = await adminClient
          .from("issuer_details")
          .select("id")
          .eq("ticker", issuerRequest.desired_ticker.toUpperCase())
          .single();

        const { error: linkError } = await adminClient
          .from("issuer_details")
          .update({ user_id: userId })
          .eq("ticker", issuerRequest.desired_ticker.toUpperCase());

        if (linkError) {
          console.error("Failed to link user to issuer via ticker:", linkError);
          return NextResponse.json(
            { success: false, error: "Failed to link issuer record" },
            { status: 500 }
          );
        }

        // Set app_metadata so the frontend can detect issuer status
        if (issuerRecord) {
          const { error: metaError } = await adminClient.auth.admin.updateUserById(userId, {
            app_metadata: {
              issuer: true,
              issuer_id: issuerRecord.id,
            },
          });

          if (metaError) {
            console.error("Failed to set issuer app_metadata (fallback):", metaError);
          }
        }
      } else {
        return NextResponse.json(
          { success: false, error: "No matching issuer record found for this email" },
          { status: 404 }
        );
      }
    }

    // 2. Also ensure a users table row exists (for USDP balance, profile, etc.)
    const { data: existingUser } = await adminClient
      .from("users")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    if (!existingUser) {
      const username = email.split("@")[0] || "issuer";
      await adminClient.from("users").insert({
        user_id: userId,
        username,
        usdp_balance: 1000,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("link-issuer error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
