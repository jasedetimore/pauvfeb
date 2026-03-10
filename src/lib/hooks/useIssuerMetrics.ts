"use client";

import useSWR from "swr";
import { useCallback } from "react";

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
  isTradable: boolean;
  refetch: () => Promise<void>;
  refetchWithLoading: () => Promise<void>;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) throw new Error("Talent not found");
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

export function useIssuerMetrics(ticker: string | null): UseIssuerMetricsResult {
  const { data, error, isLoading, mutate } = useSWR(
    ticker ? `/api/issuers/${encodeURIComponent(ticker)}/metrics` : null,
    fetcher,
    {
      // 30s poll balances UX freshness vs egress cost. Immediate refresh
      // still happens after order placement via explicit refetchMetrics().
      refreshInterval: 30000,
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );

  const isTradable = data?.tradable !== false;

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    metrics: isTradable && data?.metrics ? data.metrics : null,
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    isTradable,
    refetch,
    refetchWithLoading: refetch,
  };
}
