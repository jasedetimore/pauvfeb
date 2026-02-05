import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/issuers/stats/refresh
 * Triggers a refresh of the issuer_stats_cache table
 * This endpoint should be called by a cron job every 5 minutes
 * 
 * Security: Requires either:
 * - A valid cron secret header (for automated jobs)
 * - Admin authentication (for manual triggers)
 */
export async function POST(request: NextRequest) {
  try {
    // Check for cron secret (for automated jobs)
    const cronSecret = request.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;

    // For now, allow the refresh if cron secret matches or if it's a local request
    // In production, you'd want stricter authentication
    const isAuthorized = 
      (expectedSecret && cronSecret === expectedSecret) ||
      process.env.NODE_ENV === "development";

    if (!isAuthorized) {
      // Check if user is admin
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
        
        if (error || !user) {
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
          );
        }

        // Check if user is admin (has admin claim)
        const { data: claims } = await supabaseAuth
          .from("user_custom_claims")
          .select("claims")
          .eq("user_id", user.id)
          .single();

        if (!claims?.claims?.is_admin) {
          return NextResponse.json(
            { error: "Forbidden - Admin access required" },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    // Create Supabase client with service role for cache refresh
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Call the refresh function
    const startTime = Date.now();
    const { error } = await supabase.rpc("refresh_issuer_stats_cache");

    if (error) {
      console.error("[Stats Refresh API] Database error:", error);
      return NextResponse.json(
        { error: "Failed to refresh cache", details: error.message },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;

    // Get count of refreshed issuers
    const { count } = await supabase
      .from("issuer_stats_cache")
      .select("*", { count: "exact", head: true });

    console.log(`[Stats Refresh API] Cache refreshed: ${count} issuers in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: "Cache refreshed successfully",
      refreshedAt: new Date().toISOString(),
      issuerCount: count,
      durationMs: duration,
    });
  } catch (error) {
    console.error("[Stats Refresh API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
