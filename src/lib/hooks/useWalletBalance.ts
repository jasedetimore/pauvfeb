'use client';

import useSWR from 'swr';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

interface WalletBalance {
  balance: number;
}

// Exported so WalletDepositsWithdrawalsSection can optimistically update the
// cached balance via SWR's global mutate() without a refetch round-trip.
export const WALLET_BALANCE_KEY = 'wallet-balance';

async function fetchWalletBalance(): Promise<WalletBalance> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('users')
    .select('usdp_balance')
    .eq('user_id', user.id)
    .single();

  if (error) {
    throw new Error('Failed to fetch wallet balance');
  }

  return { balance: parseFloat(data.usdp_balance) || 0 };
}

/**
 * Hook to get the current user's wallet balance.
 * Uses SWR for caching, deduplication, and automatic revalidation.
 * Balance can be optimistically updated via: mutate(WALLET_BALANCE_KEY, { balance: newVal }, { revalidate: false })
 */
export function useMyWalletBalance() {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR<WalletBalance>(
    user ? WALLET_BALANCE_KEY : null,
    fetchWalletBalance,
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  );

  return {
    data,
    isLoading,
    error,
    refetch: async () => { await mutate(); },
  };
}
