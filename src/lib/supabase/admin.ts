import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase admin client using the service_role key.
 * This bypasses RLS and should ONLY be used in server-side admin routes.
 * 
 * IMPORTANT: Never expose the service_role key to the client.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing Supabase environment variables for admin client"
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Verify that the user has admin privileges by checking the JWT claims.
 * Returns the user data if admin, throws an error otherwise.
 */
export async function verifyAdminFromJWT(
  authHeader: string | null
): Promise<{ userId: string; email: string }> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const token = authHeader.replace("Bearer ", "");
  const adminClient = createAdminClient();

  // Verify the JWT and get user data
  const { data: { user }, error } = await adminClient.auth.getUser(token);

  if (error || !user) {
    throw new Error("Invalid or expired token");
  }

  // Check for admin claim in app_metadata
  const isAdmin = user.app_metadata?.admin === true;

  if (!isAdmin) {
    throw new Error("User does not have admin privileges");
  }

  return {
    userId: user.id,
    email: user.email || "unknown",
  };
}

/**
 * Extract IP address from request headers
 */
export function getClientIP(request: Request): string | null {
  // Cloudflare headers
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  if (cfConnectingIP) return cfConnectingIP;

  // Standard forwarded header
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  // Real IP header
  const xRealIP = request.headers.get("x-real-ip");
  if (xRealIP) return xRealIP;

  return null;
}

/**
 * Log an action to the security audit table
 */
export async function logAuditEntry(params: {
  adminId: string;
  action: string;
  targetTable: string;
  targetId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string;
}): Promise<string> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.rpc("log_audit_entry", {
    p_admin_id: params.adminId,
    p_action: params.action,
    p_target_table: params.targetTable,
    p_target_id: params.targetId || null,
    p_old_value: params.oldValue || null,
    p_new_value: params.newValue || null,
    p_metadata: params.metadata || {},
    p_ip_address: params.ipAddress || null,
    p_user_agent: params.userAgent || null,
    p_request_id: params.requestId || null,
  });

  if (error) {
    console.error("Failed to log audit entry:", error);
    throw new Error("Failed to log audit entry");
  }

  return data as string;
}

/**
 * Type definitions for admin operations
 */
export interface IssuerTradingUpdate {
  ticker: string;
  current_supply?: number;
  base_price?: number;
  price_step?: number;
  current_price?: number;
  total_usdp?: number;
}

export interface TransactionUpdate {
  id: string;
  status?: "completed" | "failed" | "refunded";
  amount_usdp?: number;
  avg_price_paid?: number;
  pv_traded?: number;
}

/**
 * Admin operation error class
 */
export class AdminOperationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "ADMIN_ERROR"
  ) {
    super(message);
    this.name = "AdminOperationError";
  }
}
