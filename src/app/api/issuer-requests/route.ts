import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/issuer-requests
 * Inserts a new row into issuer_requests and sends an email notification
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      phone,
      social_media_platform,
      social_media_handle,
      desired_ticker,
      message,
    } = body;

    // Server-side validation
    if (!name || !email || !phone || !social_media_platform || !social_media_handle || !desired_ticker) {
      return NextResponse.json(
        { error: "All required fields must be filled out." },
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
