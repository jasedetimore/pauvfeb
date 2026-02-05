import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/issuers/[ticker]/holders
 * Fetches top holders for an issuer from the portfolio table
 * Returns username, quantity held, and percentage of total supply
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const upperTicker = ticker.toUpperCase();

    // Parse query params for pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Create Supabase client with service role for full access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch total supply and holders in parallel
    const [supplyResult, holdersResult] = await Promise.all([
      // Get current supply from issuer_trading
      supabase
        .from("issuer_trading")
        .select("current_supply")
        .eq("ticker", upperTicker)
        .single(),

      // Get all holders with their amounts
      supabase
        .from("portfolio")
        .select("user_id, pv_amount")
        .eq("ticker", upperTicker)
        .gt("pv_amount", 0)
        .order("pv_amount", { ascending: false })
        .limit(limit),
    ]);

    // Handle supply fetch error
    if (supplyResult.error) {
      console.error("[Holders API] Supply fetch error:", supplyResult.error);
      // If issuer not found in trading, check if it exists at all
      const issuerCheck = await supabase
        .from("issuer_details")
        .select("ticker")
        .eq("ticker", upperTicker)
        .single();

      if (issuerCheck.error) {
        return NextResponse.json(
          { error: "Issuer not found" },
          { status: 404 }
        );
      }
      // Issuer exists but no trading data yet - return empty holders
      return NextResponse.json({
        holders: [],
        totalSupply: 0,
        ticker: upperTicker,
      });
    }

    // Handle holders fetch error
    if (holdersResult.error) {
      console.error("[Holders API] Holders fetch error:", holdersResult.error);
      return NextResponse.json(
        { error: "Failed to fetch holders" },
        { status: 500 }
      );
    }

    const totalSupply = parseFloat(supplyResult.data?.current_supply || "0");
    const portfolioHolders = holdersResult.data || [];

    // If no holders, return empty array
    if (portfolioHolders.length === 0) {
      return NextResponse.json({
        holders: [],
        totalSupply,
        ticker: upperTicker,
      });
    }

    // Fetch usernames for all holder user_ids
    const userIds = portfolioHolders.map((h) => h.user_id);
    const usersResult = await supabase
      .from("users")
      .select("user_id, username")
      .in("user_id", userIds);

    if (usersResult.error) {
      console.error("[Holders API] Users fetch error:", usersResult.error);
      // Continue with unknown usernames instead of failing
    }

    // Create a map of user_id -> username for quick lookup
    const usernameMap = new Map<string, string>();
    (usersResult.data || []).forEach((user) => {
      usernameMap.set(user.user_id, user.username);
    });

    // Transform data to include supply percentage and username
    const holders = portfolioHolders.map((holder) => {
      const quantity = parseFloat(String(holder.pv_amount) || "0");
      const supplyPercentage = totalSupply > 0 ? (quantity / totalSupply) * 100 : 0;
      const username = usernameMap.get(holder.user_id) || "Unknown";

      return {
        username,
        quantity,
        supplyPercentage,
      };
    });

    return NextResponse.json({
      holders,
      totalSupply,
      ticker: upperTicker,
    });
  } catch (error) {
    console.error("[Holders API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
