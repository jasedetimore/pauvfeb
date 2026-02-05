"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { RealtimeChannel } from "@supabase/supabase-js";

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
  priceStep: number;
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
 * Features:
 * - Auto-refreshes when issuer_trading table updates via Supabase Realtime
 * - Includes 24h Volume, Circulating Supply, Holders, Market Cap
 * - 1h, 24h, 7d price changes from price_history
 */
export function useIssuerMetrics(ticker: string | null): UseIssuerMetricsResult {
  const [metrics, setMetrics] = useState<IssuerMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

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

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Subscribe to Realtime updates for this issuer
  useEffect(() => {
    if (!ticker) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Subscribe to changes on issuer_trading table for this ticker
    const channel = supabase
      .channel(`issuer-metrics-${ticker.toUpperCase()}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "issuer_trading",
          filter: `ticker=eq.${ticker.toUpperCase()}`,
        },
        (payload) => {
          console.log(`[useIssuerMetrics] Realtime update for ${ticker}:`, payload);
          // Refetch metrics when issuer_trading is updated
          fetchMetrics();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[useIssuerMetrics] Subscribed to realtime updates for ${ticker}`);
        }
      });

    channelRef.current = channel;

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        console.log(`[useIssuerMetrics] Unsubscribing from ${ticker}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [ticker, fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
  };
}
