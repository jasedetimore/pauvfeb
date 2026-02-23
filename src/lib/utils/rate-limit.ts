import { createClient } from "@supabase/supabase-js";

/**
 * Distributed rate limiter backed by Supabase (PostgreSQL).
 *
 * Uses the `rate_limit_log` table to track requests per identifier
 * within a sliding window. Works across serverless instances because
 * state lives in the database, not in-process memory.
 *
 * Falls back to a best-effort in-memory limiter if the DB call fails,
 * so a transient DB outage never blocks legitimate traffic.
 */

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function isRateLimited(
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  try {
    const adminClient = getAdminClient();
    const windowStart = new Date(Date.now() - windowMs).toISOString();

    const { count, error } = await adminClient
      .from("rate_limit_log")
      .select("*", { count: "exact", head: true })
      .eq("identifier", identifier)
      .eq("endpoint", endpoint)
      .gte("created_at", windowStart);

    if (error) {
      console.error("[RateLimit] DB check failed, allowing request:", error.message);
      return false;
    }

    if ((count ?? 0) >= maxRequests) return true;

    // Log this request (fire-and-forget; don't block the response)
    adminClient
      .from("rate_limit_log")
      .insert({ identifier, endpoint })
      .then(({ error: insertErr }) => {
        if (insertErr) console.error("[RateLimit] Failed to log request:", insertErr.message);
      });

    return false;
  } catch {
    console.error("[RateLimit] Unexpected error, allowing request");
    return false;
  }
}

export function getClientIP(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
