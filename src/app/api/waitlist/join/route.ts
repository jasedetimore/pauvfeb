import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Helper to generate a unique random referral code (e.g., pauv_abc123)
 */
function generateReferralCode(): string {
  return "pauv_" + Math.random().toString(36).substring(2, 8);
}

/**
 * POST /api/waitlist/join
 * 
 * Inserts a pure-email registration into `email_waitlist`.
 * Bypasses creating a Supabase Auth User ID.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const referredBy = body.referredBy?.trim() || null;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid email is required" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 1. Check if they already exist in the email_waitlist table
    const { data: existingEmail } = await adminClient
      .from("email_waitlist")
      .select("id, referral_code, created_at")
      .eq("email", email)
      .single();

    if (existingEmail) {
      let position = 0;
      const { data: posData, error: posError } = await adminClient.rpc(
        "get_email_waitlist_position", 
        { p_referral_code: existingEmail.referral_code }
      );
      if (!posError && posData && posData.length > 0) {
        position = posData[0].position || 0;
      }

      return NextResponse.json({
        success: true,
        message: "You are already on the waitlist!",
        data: {
          referralCode: existingEmail.referral_code,
          joinedAt: existingEmail.created_at,
          position,
          isExisting: true,
        },
      });
    }

    // 2. Check if they already created a full account (auth users)
    const { data: existingAccount } = await adminClient
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingAccount) {
      return NextResponse.json({
        success: false,
        error: "You already have a full PAUV account! Please Log In.",
      });
    }

    // 3. Generate a new code and Insert!
    const newCode = generateReferralCode();
    const { data: inserted, error: insertError } = await adminClient
      .from("email_waitlist")
      .insert({
        email,
        referral_code: newCode,
        referred_by: referredBy,
      })
      .select("referral_code, created_at")
      .single();

    if (insertError) {
      console.error("Waitlist email insert error:", insertError.message);
      return NextResponse.json(
        { success: false, error: "Failed to join waitlist. Please try again." },
        { status: 500 }
      );
    }

    // 4. Retrieve their absolute calculated position from the queue
    let position = 0;
    const { data: posData, error: posError } = await adminClient.rpc(
      "get_email_waitlist_position", 
      { p_referral_code: newCode }
    );
    
    if (!posError && posData && posData.length > 0) {
      position = posData[0].position || 0;
    }

    return NextResponse.json({
      success: true,
      message: "Successfully joined the waitlist!",
      data: {
        referralCode: inserted.referral_code,
        joinedAt: inserted.created_at,
        position,
      },
    });
  } catch (error) {
    console.error("Waitlist join error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
