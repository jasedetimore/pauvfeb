import { createClient } from "@/lib/supabase/server";
import {
    IssuerDetailsDB,
    IssuerCardData,
    transformIssuerDetailsToCard,
} from "@/lib/types";
import { createClient as createAdminClient } from "@supabase/supabase-js";

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

export interface GetIssuersOptions {
    tag?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

export interface IssuersResult {
    issuers: IssuerCardData[];
    total: number;
    stats: CachedIssuerStats[];
    statsMap: Map<string, CachedIssuerStats>;
}

/**
 * Fetch all issuers and their stats server-side.
 * This combines the logic of /api/issuers and /api/issuers/stats
 * to avoid double fetching and allow server-side rendering.
 */
export async function getIssuersAndStats(options: GetIssuersOptions = {}): Promise<IssuersResult> {
    const { tag, search, limit = 50, offset = 0 } = options;
    const supabase = await createClient();

    // 1. Fetch Issuers
    let query = supabase
        .from("issuer_details")
        .select("*", { count: "exact" })
        .eq("is_hidden", false);

    if (tag) {
        query = query.ilike("tag", tag);
    }

    if (search) {
        const sanitizedSearch = search.replace(/[%_.,()]/g, "");
        if (sanitizedSearch) {
            query = query.or(`name.ilike.%${sanitizedSearch}%,ticker.ilike.%${sanitizedSearch}%`);
        }
    }

    query = query.range(offset, offset + limit - 1);

    // Order: search -> name ASC, otherwise -> created_at DESC
    if (search) {
        query = query.order("name", { ascending: true });
    } else {
        query = query.order("created_at", { ascending: false });
    }

    // 2. Fetch Stats (using admin client or anon client for public RPC)
    // We can use the same supabase client from createClient() which is likely cookie-based or anon
    // But usually RPCs are public.
    const statsRpc = supabase.rpc("get_all_issuer_stats");

    // Execute in parallel
    const [issuersRes, statsRes] = await Promise.all([query, statsRpc]);

    if (issuersRes.error) {
        console.error("Error fetching issuers:", issuersRes.error);
        throw new Error("Failed to fetch issuers");
    }

    // Process Issuers
    const issuers = (issuersRes.data as IssuerDetailsDB[]).map(transformIssuerDetailsToCard);

    // Process Stats
    const stats: CachedIssuerStats[] = (statsRes.data || []).map((row: any) => ({
        ticker: row.out_ticker,
        currentPrice: parseFloat(String(row.out_current_price)) || 0,
        price1hChange: row.out_price_1h_change != null ? parseFloat(String(row.out_price_1h_change)) : null,
        price24hChange: row.out_price_24h_change != null ? parseFloat(String(row.out_price_24h_change)) : null,
        price7dChange: row.out_price_7d_change != null ? parseFloat(String(row.out_price_7d_change)) : null,
        volume24h: parseFloat(String(row.out_volume_24h)) || 0,
        holders: row.out_holders || 0,
        marketCap: parseFloat(String(row.out_market_cap)) || 0,
        circulatingSupply: parseFloat(String(row.out_circulating_supply)) || 0,
        cachedAt: row.out_cached_at,
    }));

    const statsMap = new Map<string, CachedIssuerStats>();
    stats.forEach((s) => statsMap.set(s.ticker, s));

    return {
        issuers,
        total: issuersRes.count || 0,
        stats,
        statsMap
    };
}

/**
 * Fetch all tags server-side with dynamic issuer counts and market cap
 */
export async function getTags() {
    const supabase = await createClient();

    // 1. Fetch all tags
    const tagsPromise = supabase
        .from("tags")
        .select("*")
        .order("tag");

    // 2. Fetch all issuer tags to calculate specific counts
    const issuersPromise = supabase
        .from("issuer_details")
        .select("tag, ticker")
        .eq("is_hidden", false);

    // 3. Fetch all stats to calculate market cap
    const statsPromise = supabase.rpc("get_all_issuer_stats");

    const [tagsRes, issuersRes, statsRes] = await Promise.all([
        tagsPromise,
        issuersPromise,
        statsPromise
    ]);

    if (tagsRes.error) {
        console.error("Error fetching tags:", tagsRes.error);
        return [];
    }

    // Process stats into a map for quick lookup: ticker -> marketCap
    const tickerMarketCap: Record<string, number> = {};
    if (statsRes.data) {
        (statsRes.data as any[]).forEach((s) => {
            tickerMarketCap[s.out_ticker] = parseFloat(String(s.out_market_cap)) || 0;
        });
    }

    // Calculate counts and total market cap per tag
    const tagCounts: Record<string, number> = {};
    const tagMarketCaps: Record<string, number> = {};

    if (issuersRes.data) {
        issuersRes.data.forEach((item) => {
            const t = item.tag;
            const ticker = item.ticker;

            if (t) {
                // Count
                tagCounts[t] = (tagCounts[t] || 0) + 1;

                // Market Cap
                const cap = tickerMarketCap[ticker] || 0;
                tagMarketCaps[t] = (tagMarketCaps[t] || 0) + cap;
            }
        });
    }

    // Map DB fields to TagItemData expected by frontend
    return tagsRes.data.map((t) => ({
        id: t.id,
        name: t.tag, // Map 'tag' column to 'name' property
        description: t.description,
        issuerCount: tagCounts[t.tag] || 0, // Use dynamic count
        marketCap: tagMarketCaps[t.tag] || 0, // Use dynamic market cap
        photoUrl: t.photo_url
    }));
}
