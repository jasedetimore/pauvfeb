"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";

export interface UserTransaction {
  id: string;
  order_type: "buy" | "sell";
  pv_traded: number;
  avg_price_paid: number;
  amount_usdp: number;
  date: string;
}

interface UseUserTransactionsResult {
  transactions: UserTransaction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch the current user's transaction history for a specific issuer.
 * Uses SWR for caching and request deduplication.
 */
export function useUserTransactions(ticker: string): UseUserTransactionsResult {
  const { user, isLoading: authLoading } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    user && !authLoading && ticker
      ? ["user-transactions", ticker.toUpperCase(), user.id]
      : null,
    async () => {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("transactions")
        .select("id, order_type, pv_traded, avg_price_paid, amount_usdp, date")
        .eq("user_id", user!.id)
        .eq("ticker", ticker.toUpperCase())
        .eq("status", "completed")
        .order("date", { ascending: false })
        .limit(50);

      if (fetchError) {
        throw new Error(`Failed to fetch transactions: ${fetchError.message}`);
      }
      return (data || []) as UserTransaction[];
    },
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  return {
    transactions: data || [],
    isLoading: authLoading || isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch: async () => { await mutate(); },
  };
}
