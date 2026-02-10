"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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
}

/**
 * Hook to fetch top holders for an issuer
 * Fetches from /api/issuers/[ticker]/holders endpoint
 * 
 * Returns:
 * - holders: Array of holders with username, quantity, and supplyPercentage
 * - totalSupply: Total circulating supply of the token
 * - isLoading: Loading state
 * - error: Error message if fetch failed
 * - refetch: Function to manually refresh the data
 */
export function useTopHolders(ticker: string | null, limit: number = 10): UseTopHoldersResult {
  const [holders, setHolders] = useState<Holder[]>([]);
  const [totalSupply, setTotalSupply] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(!!ticker);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchHolders = useCallback(async () => {
    if (!ticker) {
      setHolders([]);
      setTotalSupply(0);
      return;
    }

    // Only show loading skeleton on initial fetch, not on refetches
    if (!hasFetchedRef.current) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(
        `/api/issuers/${encodeURIComponent(ticker)}/holders?limit=${limit}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Issuer not found");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TopHoldersResponse = await response.json();

      if ("error" in data && data.error) {
        throw new Error(String(data.error));
      }

      setHolders(data.holders || []);
      setTotalSupply(data.totalSupply || 0);
      hasFetchedRef.current = true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch holders";
      setError(message);
      console.error("[useTopHolders] Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [ticker, limit]);

  // Initial fetch
  useEffect(() => {
    fetchHolders();
  }, [fetchHolders]);

  return {
    holders,
    totalSupply,
    isLoading,
    error,
    refetch: fetchHolders,
  };
}
