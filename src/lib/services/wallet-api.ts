// Wallet API service — client-side functions for wallet operations
// Fetches wallet balance and transaction history from Supabase via our API routes

import { getAuthHeaders } from '@/lib/utils/auth-headers';

export interface WalletTransactionRow {
  id: string;
  transaction_type: 'deposit' | 'withdrawal';
  amount: string;
  balance_after: string;
  created_at: string;
}

/**
 * Get wallet balance for the current user
 */
export async function getWalletBalance(): Promise<{
  success: boolean;
  data?: { balance: number };
  message?: string;
}> {
  const headers = await getAuthHeaders();

  const response = await fetch('/api/payment/balance', {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Failed to fetch wallet balance',
    }));
    throw new Error(error.message || 'Failed to fetch wallet balance');
  }

  return response.json();
}

/**
 * Get wallet transactions (successful deposits/withdrawals that changed the balance)
 */
export async function getWalletTransactions(params?: {
  limit?: number;
  page?: number;
}): Promise<{
  success: boolean;
  data?: {
    transactions: WalletTransactionRow[];
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
  if (params?.page !== undefined) queryParams.set('page', params.page.toString());

  const response = await fetch(`/api/payment/transactions?status=succeeded&${queryParams.toString()}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Failed to fetch wallet transactions',
    }));
    throw new Error(error.message || 'Failed to fetch wallet transactions');
  }

  const data = await response.json();

  // Transform payment_transactions data to wallet transaction format
  if (data.success && data.data?.transactions) {
    data.data.transactions = data.data.transactions.map((tx: {
      id: string;
      type: string;
      amount_cents: number;
      balance_after?: number;
      created_at: string;
    }) => ({
      id: tx.id,
      transaction_type: tx.type,
      amount: (tx.amount_cents / 100).toFixed(2),
      balance_after: tx.balance_after?.toString() || '0',
      created_at: tx.created_at,
    }));
  }

  return data;
}
