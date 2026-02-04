/**
 * Admin Security Types
 * Type definitions for admin operations and audit logging
 */

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  admin_id: string;
  action: AuditAction;
  target_table: string;
  target_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
}

export type AuditAction =
  | "CREATE"
  | "READ"
  | "READ_ALL"
  | "UPDATE"
  | "DELETE"
  | "GRANT_ADMIN"
  | "REVOKE_ADMIN"
  | "SET_ADMIN_CLAIM"
  | "LOGIN"
  | "LOGOUT"
  | "FAILED_AUTH";

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  app_metadata: {
    admin: boolean;
    [key: string]: unknown;
  };
}

export interface IssuerTrading {
  id: string;
  ticker: string;
  current_supply: number;
  base_price: number;
  price_step: number;
  current_price: number;
  total_usdp: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount_usdp: number;
  ticker: string;
  order_type: "buy" | "sell";
  status: "completed" | "failed" | "refunded";
  avg_price_paid: number;
  pv_traded: number;
  start_price: number;
  end_price: number;
  date: string;
  queue_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends AdminApiResponse<T[]> {
  pagination: {
    total: number | null;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface AuditLogFilters {
  action?: AuditAction;
  target_table?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionFilters {
  ticker?: string;
  user_id?: string;
  status?: "completed" | "failed" | "refunded";
  limit?: number;
  offset?: number;
}
