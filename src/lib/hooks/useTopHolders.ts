"use client";

import useSWR from "swr";
import { useCallback } from "react";

export interface Holder {
  username: string;
  quantity: number;
  supplyPercentage: number;
}

interface TopHoldersResponse {
  holders: Holder[];
  totalSupply: number;
  ticker: string;
}

interface UseTopHoldersResult {
  holders: Holder[];
  totalSupply: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refetchWithLoading: () => Promise<void>;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Talent not found");
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(String(data.error));
  }
  return data;
};

/**
 * Hook to fetch top holders for an issuer
 * Fetches from /api/issuers/[ticker]/holders endpoint using SWR
 */
export function useTopHolders(ticker: string | null, limit: number = 10): UseTopHoldersResult {
  const { data, error, isLoading, mutate } = useSWR(
    ticker ? `/api/issuers/${encodeURIComponent(ticker)}/holders?limit=${limit}` : null,
    fetcher,
    { dedupingInterval: 10000, revalidateOnFocus: false }
  );

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    holders: data?.holders || [],
    totalSupply: data?.totalSupply || 0,
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
    refetchWithLoading: refetch,
  };
}
