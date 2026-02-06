import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/launch-notify
 * Stores an email signup for an issuer launch notification.
 * Body: { email: string, ticker: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, ticker } = await request.json();

    if (!email || !ticker) {
      return NextResponse.json(
        { error: "Email and ticker are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from("launch_notifications")
      .upsert(
        { email: email.toLowerCase().trim(), ticker: ticker.toUpperCase() },
        { onConflict: "email,ticker" }
      );

    if (error) {
      console.error("[launch-notify] Insert error:", error);
      return NextResponse.json(
        { error: "Failed to save notification signup" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[launch-notify] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
