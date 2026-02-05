"use client";

import { useState, useEffect, useCallback } from "react";

export interface IssuerMetrics {
  ticker: string;
  currentPrice: number;
  volume24h: number;
  circulatingSupply: number;
  holders: number;
  marketCap: number;
  price1hChange: number | null;
  price24hChange: number | null;
  price7dChange: number | null;
  totalUsdp: number;
  updatedAt: string;
}

interface UseIssuerMetricsResult {
  metrics: IssuerMetrics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch real-time trading metrics for an issuer
 * Fetches from /api/issuers/[ticker]/metrics endpoint
 * 
 * Metrics include:
 * - 24h Volume (from transactions)
 * - Circulating Supply (from issuer_trading)
 * - Holders count (from portfolio)
 * - Market Cap (current_price * supply)
 * - 1h, 24h, 7d price changes (from price_history)
 */
export function useIssuerMetrics(ticker: string | null): UseIssuerMetricsResult {
  const [metrics, setMetrics] = useState<IssuerMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!ticker) {
      setMetrics(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/issuers/${encodeURIComponent(ticker)}/metrics`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Issuer not found");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMetrics(data.metrics);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch metrics";
      setError(message);
      console.error("[useIssuerMetrics] Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
  };
}
