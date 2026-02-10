import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Simple in-memory rate limiter by IP.
 * Allows maxRequests per windowMs per IP address.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 3; // 3 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // Clean up expired entries periodically
  if (rateLimitMap.size > 10000) {
    const entries = Array.from(rateLimitMap.entries());
    for (const [key, val] of entries) {
      if (val.resetAt < now) rateLimitMap.delete(key);
    }
  }

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

/**
 * POST /api/issuer-requests
 * Inserts a new row into issuer_requests and sends an email notification
 * Rate limited: 3 requests per minute per IP.
 */
export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
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
