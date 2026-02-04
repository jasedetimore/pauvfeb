import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TagDB, TagData, TagsApiResponse } from "@/lib/types";

/**
 * GET /api/tags
 * Fetches all tags from the tags table
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error, count } = await supabase
      .from("tags")
      .select("*", { count: "exact" })
      .order("tag", { ascending: true });

    if (error) {
      console.error("Error fetching tags:", error);
      return NextResponse.json(
        {
          tags: [],
          total: 0,
          error: error.message,
        } as TagsApiResponse,
        { status: 500 }
      );
    }

    const tags: TagData[] = (data as TagDB[]).map((tag) => ({
      id: tag.id,
      name: tag.tag,
      issuerCount: tag.number_of_issuers ?? 0,
      marketCap: 0,
      description: tag.description,
      photoUrl: tag.photo_url,
    }));

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
