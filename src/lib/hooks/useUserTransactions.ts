"use client";

import { useState, useEffect, useCallback } from "react";
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
 * Hook to fetch the current user's transaction history for a specific issuer
 * @param ticker - The issuer ticker to filter transactions by
 */
export function useUserTransactions(ticker: string): UseUserTransactionsResult {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!user || !ticker) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from("transactions")
        .select("id, order_type, pv_traded, avg_price_paid, amount_usdp, date")
        .eq("user_id", user.id)
        .eq("ticker", ticker.toUpperCase())
        .eq("status", "completed")
        .order("date", { ascending: false })
        .limit(50);

      if (fetchError) {
        throw new Error(`Failed to fetch transactions: ${fetchError.message}`);
      }

      setTransactions(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error fetching user transactions:", message);
    } finally {
      setIsLoading(false);
    }
  }, [user, ticker]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
  };
}
