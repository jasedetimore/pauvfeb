"use client";

import { useState, useEffect, useCallback } from "react";
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
 * Hook to fetch the current user's portfolio holdings
 * Includes average cost basis and last purchase date from transactions
 */
export function usePortfolio(): UsePortfolioResult {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!user) {
      setHoldings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Fetch portfolio holdings for the current user
      const { data: portfolioData, error: portfolioError } = await supabase
        .from("portfolio")
        .select("ticker, pv_amount, avg_cost_basis")
        .eq("user_id", user.id)
        .gt("pv_amount", 0);

      if (portfolioError) {
        throw new Error(`Failed to fetch portfolio: ${portfolioError.message}`);
      }

      if (!portfolioData || portfolioData.length === 0) {
        setHoldings([]);
        setIsLoading(false);
        return;
      }

      // Get all tickers to fetch current prices in bulk
      const tickers = portfolioData.map((h: { ticker: string }) => h.ticker);
      
      // Fetch current prices from issuer_trading
      const { data: pricesData } = await supabase
        .from("issuer_trading")
        .select("ticker, current_price")
        .in("ticker", tickers);
      
      const priceMap = new Map<string, number>();
      pricesData?.forEach((p: { ticker: string; current_price: number }) => {
        priceMap.set(p.ticker, Number(p.current_price));
      });

      // For each holding, get the last purchase date from transactions
      const holdingsWithDates: PortfolioHolding[] = await Promise.all(
        portfolioData.map(async (holding: { ticker: string; pv_amount: number; avg_cost_basis: number }) => {
          // Get the most recent BUY transaction for this ticker
          const { data: lastTx } = await supabase
            .from("transactions")
            .select("date")
            .eq("user_id", user.id)
            .eq("ticker", holding.ticker)
            .eq("order_type", "BUY")
            .eq("status", "completed")
            .order("date", { ascending: false })
            .limit(1)
            .single();

          return {
            ticker: holding.ticker,
            pvAmount: Number(holding.pv_amount),
            avgCostBasis: Number(holding.avg_cost_basis),
            currentPrice: priceMap.get(holding.ticker) ?? 0,
            lastPurchaseDate: lastTx?.date ?? null,
          };
        })
      );

      setHoldings(holdingsWithDates);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch portfolio";
      setError(message);
      console.error("Error fetching portfolio:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return {
    holdings,
    isLoading,
    error,
    refetch: fetchPortfolio,
  };
}
