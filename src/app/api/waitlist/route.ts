import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/waitlist
 *
 * Returns the authenticated user's waitlist position and their 2 nearest
 * neighbors above and below.
 *
 * Response shape:
 * {
 *   position: number;
 *   neighbors: { position: number; username: string; userId: string; isCurrentUser: boolean }[];
 * }
 */
export async function GET() {
  const supabase = await createClient();

  // Authenticate
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Call the Postgres function to get position + neighbors
  const { data, error } = await supabase.rpc("get_waitlist_neighbors", {
    p_user_id: user.id,
    p_radius: 2,
  });

  if (error) {
    console.error("[waitlist] get_waitlist_neighbors error:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist position" },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "User not found on waitlist" },
      { status: 404 }
    );
  }

  // Find the user's own row to extract their position + referral data
  const self = data.find(
    (row: { isCurrentUser: boolean }) => row.isCurrentUser
  );
  const position = self?.position ?? 0;
  const referralCode = self?.referralCode ?? null;
  const referralCount = self?.referralCount ?? 0;

  return NextResponse.json({
    position,
    referralCode,
    referralCount,
    neighbors: data,
  });
}
