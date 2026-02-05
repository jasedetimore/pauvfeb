import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export interface CachedIssuerStats {
  ticker: string;
  currentPrice: number;
  price1hChange: number | null;
  price24hChange: number | null;
  price7dChange: number | null;
  volume24h: number;
  holders: number;
  marketCap: number;
  circulatingSupply: number;
  cachedAt: string;
}

/**
 * GET /api/issuers/stats
 * Fetches all cached issuer statistics from the issuer_stats_cache table
 * Returns pre-computed metrics that are refreshed every 5 minutes
 */
export async function GET() {
  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch all cached stats from the function
    const { data, error } = await supabase.rpc("get_all_issuer_stats");

    if (error) {
      console.error("[Stats API] Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch cached stats" },
        { status: 500 }
      );
    }

    // Transform the data to match frontend expectations
    const stats: CachedIssuerStats[] = (data || []).map((row: {
      out_ticker: string;
      out_current_price: string | number;
      out_price_1h_change: string | number | null;
      out_price_24h_change: string | number | null;
      out_price_7d_change: string | number | null;
      out_volume_24h: string | number;
      out_holders: number;
      out_market_cap: string | number;
      out_circulating_supply: string | number;
      out_cached_at: string;
    }) => ({
      ticker: row.out_ticker,
      currentPrice: parseFloat(String(row.out_current_price)) || 0,
      price1hChange: row.out_price_1h_change != null 
        ? parseFloat(String(row.out_price_1h_change)) 
        : null,
      price24hChange: row.out_price_24h_change != null 
        ? parseFloat(String(row.out_price_24h_change)) 
        : null,
      price7dChange: row.out_price_7d_change != null 
        ? parseFloat(String(row.out_price_7d_change)) 
        : null,
      volume24h: parseFloat(String(row.out_volume_24h)) || 0,
      holders: row.out_holders || 0,
      marketCap: parseFloat(String(row.out_market_cap)) || 0,
      circulatingSupply: parseFloat(String(row.out_circulating_supply)) || 0,
      cachedAt: row.out_cached_at,
    }));

    // Get the most recent cache timestamp
    const latestCacheTime = stats.length > 0 
      ? stats.reduce((latest, s) => {
          const time = new Date(s.cachedAt).getTime();
          return time > latest ? time : latest;
        }, 0)
      : null;

    return NextResponse.json({
      stats,
      cacheInfo: {
        count: stats.length,
        lastUpdated: latestCacheTime ? new Date(latestCacheTime).toISOString() : null,
      },
    });
  } catch (error) {
    console.error("[Stats API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
