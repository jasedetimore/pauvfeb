import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited, getClientIP } from "@/lib/utils/rate-limit";

/**
 * POST /api/issuer-requests
 * Inserts a new row into issuer_requests and sends an email notification
 * Rate limited: 3 requests per minute per IP (distributed via DB).
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);

    if (await isRateLimited(ip, "/api/issuer-requests", 3, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    const {
      name,
      email,
      phone,
      social_media_platform,
      social_media_handle,
      desired_ticker,
      message,
      user_id,
      terms_accepted,
    } = body;

    // Server-side validation
    if (!name || !email || !phone || !social_media_platform || !social_media_handle || !desired_ticker) {
      return NextResponse.json(
        { error: "All required fields must be filled out." },
        { status: 400 }
      );
    }

    if (!terms_accepted) {
      return NextResponse.json(
        { error: "You must agree to the Terms of Service, Privacy Policy, and Issuer Terms." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error: dbError } = await supabase
      .from("issuer_requests")
      .insert({
        name,
        email,
        phone,
        social_media_platform,
        social_media_handle,
        desired_ticker: desired_ticker.toUpperCase(),
        message: message || null,
        terms_accepted_at: new Date().toISOString(),
        ...(user_id ? { user_id } : {}),
      });

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      return NextResponse.json(
        { error: "Failed to submit request. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Issuer request error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
