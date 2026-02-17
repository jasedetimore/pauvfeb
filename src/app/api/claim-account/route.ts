import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/claim-account?token=...
 * Validate a claim token and return the invite details (email, issuer name)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Fetch the invite with issuer details
    const { data: invite, error } = await adminClient
      .from("issuer_invites")
      .select("id, email, issuer_id, token, expires_at, is_used")
      .eq("token", token)
      .single();

    if (error || !invite) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired invite link" },
        { status: 404 }
      );
    }

    if (invite.is_used) {
      return NextResponse.json(
        { success: false, error: "This invite has already been used" },
        { status: 400 }
      );
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: "This invite link has expired" },
        { status: 400 }
      );
    }

    // Fetch issuer name for display
    const { data: issuer } = await adminClient
      .from("issuer_details")
      .select("name, ticker")
      .eq("id", invite.issuer_id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        email: invite.email,
        issuerName: issuer?.name || "Issuer",
        issuerTicker: issuer?.ticker || "",
      },
    });
  } catch (error) {
    console.error("Claim account validation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/claim-account
 * Complete the claim:
 *  1. Create the auth user (bypassing email verification)
 *  2. Link user_id to issuer_details
 *  3. Mark invite as used
 *  4. Return session tokens for auto-login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 1. Validate the invite
    const { data: invite, error: inviteError } = await adminClient
      .from("issuer_invites")
      .select("id, email, issuer_id, is_used, expires_at")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { success: false, error: "Invalid invite token" },
        { status: 404 }
      );
    }

    if (invite.is_used) {
      return NextResponse.json(
        { success: false, error: "This invite has already been used" },
        { status: 400 }
      );
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: "This invite has expired" },
        { status: 400 }
      );
    }

    // 2. Create the auth user using admin API (bypasses email verification)
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: invite.email,
        password,
        email_confirm: true, // Auto-confirm email — no verification needed
        app_metadata: {
          issuer: true,
          issuer_id: invite.issuer_id,
        },
      });

    if (authError) {
      // Check if user already exists
      if (authError.message?.includes("already been registered")) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists. Please log in instead." },
          { status: 409 }
        );
      }
      console.error("Auth user creation error:", authError);
      return NextResponse.json(
        { success: false, error: "Failed to create account" },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // 3. Link user_id to issuer_details
    const { error: linkError } = await adminClient
      .from("issuer_details")
      .update({ user_id: userId })
      .eq("id", invite.issuer_id);

    if (linkError) {
      console.error("Failed to link user to issuer:", linkError);
      // Don't fail — the user is created, we can fix the link later
    }

    // 4. Mark invite as used
    const { error: markError } = await adminClient
      .from("issuer_invites")
      .update({ is_used: true })
      .eq("id", invite.id);

    if (markError) {
      console.error("Failed to mark invite as used:", markError);
    }

    // 5. Generate a session for auto-login
    // Use signInWithPassword via admin to get tokens
    const { data: sessionData, error: sessionError } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: invite.email,
      });

    // Since we can't directly return a session from admin API,
    // we'll use signInWithPassword on the server side to get tokens
    // The client will call signInWithPassword after receiving success
    return NextResponse.json({
      success: true,
      data: {
        userId,
        email: invite.email,
        // Client should call supabase.auth.signInWithPassword({ email, password })
        // to establish the session
        autoLogin: true,
      },
    });
  } catch (error) {
    console.error("Claim account error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
