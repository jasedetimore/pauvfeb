'use client';

// Wallet balance hook using React Query for caching/reactivity

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

interface WalletBalance {
  balance: number;
}

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
 * Uses React Query for caching and automatic refetching.
 * Balance can be updated via queryClient.setQueryData(['my-wallet-balance'], { balance: newVal })
 */
export function useMyWalletBalance() {
  const { user } = useAuth();

  return useQuery<WalletBalance>({
    queryKey: ['my-wallet-balance'],
    queryFn: fetchWalletBalance,
    enabled: !!user,
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}
