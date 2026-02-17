import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { 
  IssuerDetailsDB, 
  transformIssuerDetailsToCard 
} from "@/lib/types";

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

/**
 * GET /api/issuers/[ticker]
 * Fetches a single issuer by ticker symbol
 */
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { ticker } = await params;
    
    if (!ticker) {
      return NextResponse.json(
        { error: "Ticker is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("issuer_details")
      .select("*")
      .ilike("ticker", ticker)
      .eq("is_hidden", false)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Issuer not found" },
          { status: 404 }
        );
      }
      console.error("Error fetching issuer:", error);
      return NextResponse.json(
        { error: "Failed to fetch issuer" },
        { status: 500 }
      );
    }

    const issuer = transformIssuerDetailsToCard(data as IssuerDetailsDB);

    return NextResponse.json({ issuer });
  } catch (error) {
    console.error("Error in issuer API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
