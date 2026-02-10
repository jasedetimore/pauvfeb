// Payment-related types and interfaces

export interface InitiatePaymentRequest {
  amount: number;
}

export interface PaymentCheckoutResponse {
  success: boolean;
  message: string;
  data?: {
    checkout_url: string;
    checkout_id: string;
  };
}

export interface PaymentError {
  success: false;
  message: string;
  statusCode: number;
  timestamp?: string;
  path?: string;
}

export interface PendingPaymentState {
  checkout_id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  timestamp: number;
  status: 'pending';
}

export interface PaymentCallbackParams {
  checkout_id?: string;
  error?: string;
  message?: string;
}

// WebSocket Payment Update Event (from backend)
export interface PaymentUpdateEvent {
  checkout_id: string;        // The checkout ID from Soap
  type: 'deposit' | 'withdrawal';
  status: 'succeeded' | 'failed' | 'pending' | 'held' | 'expired' | 'terminally_failed' | 'returned';
  amount_cents: number;       // Amount in cents (e.g., 10050 = $100.50)
  balance_after?: number;     // Balance after transaction (in USDP) - NEW
  balance_after_usdp?: string; // Formatted balance for display - NEW
  message?: string;           // Optional message
  timestamp: string;          // ISO timestamp
}

// Payment Transaction (from /api/payment/transactions endpoint)
export interface PaymentTransaction {
  id: string;
  checkout_id: string;
  type: 'deposit' | 'withdrawal';
  status: 'succeeded' | 'failed' | 'held' | 'expired' | 'terminally_failed' | 'returned' | string;
  amount_cents: number;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

// Pagination metadata
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  page?: number;
  total_pages?: number;
  has_more: boolean;
  has_next?: boolean;
  has_prev?: boolean;
}

