// Payment gateway API service for Soap integration

import { getAuthHeaders } from './auth-headers';
import { 
  PaymentCheckoutResponse,
  PendingPaymentState 
} from '@/types/payment';
import { storeCheckoutState } from '@/utils/payment-storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`
  : "";

/**
 * Initiate a deposit payment
 * Creates a Soap checkout session and returns checkout URL
 */
export async function initiateDeposit(
  amount: number
): Promise<PaymentCheckoutResponse> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/payment/deposit/initiate`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "Failed to initiate deposit",
    }));
    
    const errorMessage = Array.isArray(error.message)
      ? error.message.join(', ')
      : error.message || "Failed to initiate deposit";
    
    throw new Error(errorMessage);
  }

  const data: PaymentCheckoutResponse = await response.json();

  if (data.success && data.data) {
    // Store checkout state for recovery
    const checkoutState: PendingPaymentState = {
      checkout_id: data.data.checkout_id,
      type: 'deposit',
      amount: amount,
      timestamp: Date.now(),
      status: 'pending',
    };
    storeCheckoutState(checkoutState);
    
    return data;
  } else {
    throw new Error(data.message || "Invalid deposit response format");
  }
}

/**
 * Initiate a withdrawal payment
 * Creates a Soap checkout session and returns checkout URL
 */
export async function initiateWithdrawal(
  amount: number
): Promise<PaymentCheckoutResponse> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/payment/withdraw/initiate`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "Failed to initiate withdrawal",
    }));
    
    const errorMessage = Array.isArray(error.message)
      ? error.message.join(', ')
      : error.message || "Failed to initiate withdrawal";
    
    throw new Error(errorMessage);
  }

  const data: PaymentCheckoutResponse = await response.json();

  if (data.success && data.data) {
    // Store checkout state for recovery
    const checkoutState: PendingPaymentState = {
      checkout_id: data.data.checkout_id,
      type: 'withdrawal',
      amount: amount,
      timestamp: Date.now(),
      status: 'pending',
    };
    storeCheckoutState(checkoutState);
    
    return data;
  } else {
    throw new Error(data.message || "Invalid withdrawal response format");
  }
}

/**
 * Verify payment status
 * Backend endpoint: GET /payment/status?checkout_id=chk_abc123
 * 
 * Use for:
 * - Initial page load (check if pending payment completed)
 * - Manual status check (user clicks "Check Status")
 * - WebSocket fallback (if connection lost)
 * 
 * Do NOT use for:
 * - Polling/interval checks (use WebSocket instead)
 * - Real-time updates (use WebSocket instead)
 */
export async function checkPaymentStatus(
  checkoutId: string
): Promise<{
  success: boolean;
  data?: {
    checkout_id: string;
    type: 'deposit' | 'withdrawal';
    status: 'pending' | 'succeeded' | 'failed' | 'held' | 'expired' | 'terminally_failed';
    amount_cents: number;
    created_at?: string;
    updated_at?: string;
  };
  message?: string;
}> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(
    `${API_BASE_URL}/payment/status?checkout_id=${checkoutId}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      // Transaction not found - might be completed and removed, or invalid ID
      const error = await response.json().catch(() => ({
        message: "Payment transaction not found",
      }));
      throw new Error(error.message || "Payment transaction not found");
    }
    
    const error = await response.json().catch(() => ({
      message: "Failed to check payment status",
    }));
    throw new Error(error.message || "Failed to check payment status");
  }

  return response.json();
}

/**
 * Get payment transactions (all payment attempts)
 * Shows all payment attempts including failed and expired ones
 * 
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated payment transactions
 */
export async function getPaymentTransactions(params?: {
  limit?: number;
  offset?: number;
  page?: number;
  status?: string; // Can be comma-separated: 'failed,expired,terminally_failed'
  type?: 'deposit' | 'withdrawal';
}): Promise<{
  success: boolean;
  data?: {
    transactions: Array<{
      id: string;
      checkout_id: string;
      type: 'deposit' | 'withdrawal';
      status: string;
      amount_cents: number;
      failure_reason: string | null;
      created_at: string;
      updated_at: string;
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      page?: number;
      total_pages?: number;
      has_more: boolean;
      has_next?: boolean;
      has_prev?: boolean;
    };
  };
  message?: string;
}> {
  const headers = await getAuthHeaders();
  
  const queryParams = new URLSearchParams();
  if (params?.limit !== undefined) queryParams.set('limit', params.limit.toString());
  
  // Use page if provided, otherwise use offset
  if (params?.page !== undefined) {
    queryParams.set('page', params.page.toString());
  } else if (params?.offset !== undefined) {
    queryParams.set('offset', params.offset.toString());
  }
  
  if (params?.status) queryParams.set('status', params.status);
  if (params?.type) queryParams.set('type', params.type);
  
  const response = await fetch(`${API_BASE_URL}/payment/transactions?${queryParams.toString()}`, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Failed to fetch payment transactions',
    }));
    throw new Error(error.message || 'Failed to fetch payment transactions');
  }
  
  const data = await response.json();
  
  // Handle both old format (direct fields) and new format (pagination object)
  if (data.success && data.data) {
    if (data.data.pagination) {
      // New format with pagination object
      return data;
    } else {
      // Old format - wrap in pagination object
      return {
        ...data,
        data: {
          transactions: data.data.transactions || [],
          pagination: {
            total: data.data.total || 0,
            limit: data.data.limit || params?.limit || 20,
            offset: data.data.offset || 0,
            page: data.data.page,
            total_pages: data.data.total_pages,
            has_more: data.data.has_more || false,
            has_next: data.data.has_next,
            has_prev: data.data.has_prev,
          }
        }
      };
    }
  }
  
  return data;
}

