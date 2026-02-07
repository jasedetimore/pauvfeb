import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/issuers/[ticker]/metrics
 * Fetches real-time trading metrics for an issuer
 * Includes: 24h Volume, Circulating Supply, Holders, Market Cap, 1h/24h/7d price changes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const upperTicker = ticker.toUpperCase();

    // Create Supabase client with service role for full access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all metrics in parallel
    const [
      tradingData,
      holdersCount,
      volume24h,
      priceChange1h,
      priceChange24h,
      priceChange7d,
    ] = await Promise.all([
      // Get issuer trading data (current price, supply)
      supabase
        .from("issuer_trading")
        .select("current_price, current_supply, total_usdp")
        .eq("ticker", upperTicker)
        .single(),

      // Count unique holders from portfolio
      supabase
        .from("portfolio")
        .select("user_id", { count: "exact", head: true })
        .eq("ticker", upperTicker)
        .gt("pv_amount", 0),

      // Calculate 24h volume from transactions
      supabase
        .from("transactions")
        .select("amount_usdp")
        .eq("ticker", upperTicker)
        .eq("status", "completed")
        .gte("date", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

      // Get 1h price change
      supabase.rpc("get_price_change", {
        p_ticker: upperTicker,
        p_period: "1 hour",
      }),

      // Get 24h price change
      supabase.rpc("get_price_change", {
        p_ticker: upperTicker,
        p_period: "24 hours",
      }),

      // Get 7d price change
      supabase.rpc("get_price_change", {
        p_ticker: upperTicker,
        p_period: "7 days",
      }),
    ]);

    // Handle errors
    if (tradingData.error) {
      // If code is PGRST116, it means no rows found (single() returned nothing)
      // We should return default/empty metrics instead of erroring
      if (tradingData.error.code === 'PGRST116') {
        return NextResponse.json({
          metrics: {
            ticker: upperTicker,
            currentPrice: 0,
            volume24h: 0,
            circulatingSupply: 0,
            holders: 0,
            marketCap: 0,
            price1hChange: 0,
            price24hChange: 0,
            price7dChange: 0,
            totalUsdp: 0,
            updatedAt: new Date().toISOString(),
          }
        });
      }

      console.error("[Metrics API] Trading data error:", tradingData.error);
      return NextResponse.json(
        { error: "Failed to fetch trading data" },
        { status: 500 }
      );
    }

    // Calculate 24h volume (sum of all transaction amounts)
    const totalVolume24h = volume24h.data?.reduce(
      (sum, tx) => sum + parseFloat(tx.amount_usdp || "0"),
      0
    ) || 0;

    // Calculate market cap
    const currentPrice = parseFloat(tradingData.data?.current_price || "0");
    const circulatingSupply = parseFloat(tradingData.data?.current_supply || "0");
    const marketCap = currentPrice * circulatingSupply;

    // Extract price changes
    const extractPriceChange = (result: { data: unknown; error: unknown }) => {
      if (result.error || !result.data) return null;
      const data = Array.isArray(result.data) ? result.data[0] : result.data;
      return data?.price_change_percent != null
        ? parseFloat(data.price_change_percent)
        : null;
    };

    const metrics = {
      ticker: upperTicker,
      currentPrice,
      volume24h: totalVolume24h,
      circulatingSupply,
      holders: holdersCount.count || 0,
      marketCap,
      price1hChange: extractPriceChange(priceChange1h),
      price24hChange: extractPriceChange(priceChange24h),
      price7dChange: extractPriceChange(priceChange7d),
      totalUsdp: parseFloat(tradingData.data?.total_usdp || "0"),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error("[Metrics API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
