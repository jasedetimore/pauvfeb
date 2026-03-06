"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";

export interface PortfolioHolding {
  ticker: string;
  pvAmount: number;
  avgCostBasis: number;
  currentPrice: number;
  lastPurchaseDate: string | null;
}

interface UsePortfolioResult {
  holdings: PortfolioHolding[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch the current user's portfolio holdings.
 * Uses SWR for caching and request deduplication.
 */
export function usePortfolio(): UsePortfolioResult {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    user ? ["portfolio", user.id] : null,
    async () => {
      const supabase = createClient();

      const { data: portfolioData, error: portfolioError } = await supabase
        .from("portfolio")
        .select("ticker, pv_amount, avg_cost_basis")
        .eq("user_id", user!.id)
        .gt("pv_amount", 0);

      if (portfolioError) {
        throw new Error(`Failed to fetch portfolio: ${portfolioError.message}`);
      }

      if (!portfolioData || portfolioData.length === 0) {
        return [];
      }

      const tickers = portfolioData.map((h: { ticker: string }) => h.ticker);

      const { data: pricesData } = await supabase
        .from("issuer_trading")
        .select("ticker, current_price")
        .in("ticker", tickers);

      const priceMap = new Map<string, number>();
      pricesData?.forEach((p: { ticker: string; current_price: number }) => {
        priceMap.set(p.ticker, Number(p.current_price));
      });

      // Batched into one query instead of N separate queries per holding.
      // Ordered desc so the first occurrence per ticker is the most recent.
      const { data: allBuyTxs } = await supabase
        .from("transactions")
        .select("ticker, date")
        .eq("user_id", user!.id)
        .in("ticker", tickers)
        .eq("order_type", "buy")
        .eq("status", "completed")
        .order("date", { ascending: false });

      const lastBuyDateMap = new Map<string, string>();
      allBuyTxs?.forEach((tx: { ticker: string; date: string }) => {
        if (!lastBuyDateMap.has(tx.ticker)) {
          lastBuyDateMap.set(tx.ticker, tx.date);
        }
      });

      return portfolioData.map((holding: { ticker: string; pv_amount: number; avg_cost_basis: number }) => ({
        ticker: holding.ticker,
        pvAmount: Number(holding.pv_amount),
        avgCostBasis: Number(holding.avg_cost_basis),
        currentPrice: priceMap.get(holding.ticker) ?? 0,
        lastPurchaseDate: lastBuyDateMap.get(holding.ticker) ?? null,
      }));
    },
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  return {
    holdings: data || [],
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch: async () => { await mutate(); },
  };
}
