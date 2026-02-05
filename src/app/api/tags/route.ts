import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TagDB, TagData, TagsApiResponse } from "@/lib/types";

/**
 * GET /api/tags
 * Fetches all tags with live issuer counts and aggregated market caps
 * Joins tags → issuer_details → issuer_stats_cache for real data
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all tags
    const { data: tagsData, error: tagsError, count } = await supabase
      .from("tags")
      .select("*", { count: "exact" })
      .order("tag", { ascending: true });

    if (tagsError) {
      console.error("Error fetching tags:", tagsError);
      return NextResponse.json(
        {
          tags: [],
          total: 0,
          error: tagsError.message,
        } as TagsApiResponse,
        { status: 500 }
      );
    }

    // Fetch issuer counts and market cap per tag by joining issuer_details + issuer_stats_cache
    // Get all issuers with their tag and cached market cap
    const { data: issuerStats, error: issuerStatsError } = await supabase
      .from("issuer_details")
      .select("tag, ticker, issuer_stats_cache(market_cap)")
      .not("tag", "is", null);

    // Build a map of tag → { count, totalMarketCap }
    const tagStatsMap = new Map<string, { count: number; totalMarketCap: number }>();

    if (!issuerStatsError && issuerStats) {
      for (const issuer of issuerStats) {
        const tagName = (issuer.tag as string)?.toLowerCase();
        if (!tagName) continue;

        const existing = tagStatsMap.get(tagName) || { count: 0, totalMarketCap: 0 };
        existing.count += 1;

        // issuer_stats_cache is a one-to-one relation via ticker, so it comes back as an object (or null)
        const cache = issuer.issuer_stats_cache as { market_cap: number | string } | { market_cap: number | string }[] | null;
        if (cache) {
          if (Array.isArray(cache)) {
            for (const c of cache) {
              existing.totalMarketCap += parseFloat(String(c.market_cap)) || 0;
            }
          } else {
            existing.totalMarketCap += parseFloat(String(cache.market_cap)) || 0;
          }
        }

        tagStatsMap.set(tagName, existing);
      }
    }

    const tags: TagData[] = (tagsData as TagDB[]).map((tag) => {
      const tagStats = tagStatsMap.get(tag.tag.toLowerCase());
      return {
        id: tag.id,
        name: tag.tag,
        issuerCount: tagStats?.count ?? tag.number_of_issuers ?? 0,
        marketCap: tagStats?.totalMarketCap ?? 0,
        description: tag.description,
        photoUrl: tag.photo_url,
      };
    });

    return NextResponse.json({
      tags,
      total: count ?? tags.length,
    } as TagsApiResponse);
  } catch (error) {
    console.error("Error in tags API:", error);
    return NextResponse.json(
      {
        tags: [],
        total: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      } as TagsApiResponse,
      { status: 500 }
    );
  }
}
