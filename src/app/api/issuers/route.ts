import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { 
  IssuerDetailsDB, 
  IssuerCardData, 
  transformIssuerDetailsToCard,
  IssuersApiResponse 
} from "@/lib/types";

/**
 * GET /api/issuers
 * Fetches all issuers from the issuer_details table
 * 
 * Query params:
 * - tag: Filter by tag (optional)
 * - limit: Limit number of results (optional, default 50)
 * - offset: Pagination offset (optional, default 0)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from("issuer_details")
      .select("*", { count: "exact" });

    // Apply tag filter if provided
    if (tag) {
      query = query.ilike("tag", tag);
    }

    // Apply search filter (matches name or ticker)
    if (search) {
      query = query.or(`name.ilike.%${search}%,ticker.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Order by most recently created first when no search, otherwise by name
    query = search
      ? query.order("name", { ascending: true })
      : query.order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching issuers:", error);
      return NextResponse.json(
        { 
          issuers: [], 
          total: 0, 
          error: error.message 
        } as IssuersApiResponse,
        { status: 500 }
      );
    }

    // Transform DB records to UI format
    const issuers: IssuerCardData[] = (data as IssuerDetailsDB[]).map(
      transformIssuerDetailsToCard
    );

    const response: IssuersApiResponse = {
      issuers,
      total: count || 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in issuers API:", error);
    return NextResponse.json(
      { 
        issuers: [], 
        total: 0, 
        error: error instanceof Error ? error.message : "Unknown error" 
      } as IssuersApiResponse,
      { status: 500 }
    );
  }
}
