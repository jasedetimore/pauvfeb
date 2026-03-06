"use client";

import React from "react";
import { CachedIssuerStats } from "@/lib/types";

// Re-export so existing consumers (SearchDropdown, Header) don't need to change imports
export type { CachedIssuerStats };

interface CacheInfo {
  count: number;
  lastUpdated: string | null;
}

interface UseIssuerStatsResult {
  stats: CachedIssuerStats[];
  statsMap: Map<string, CachedIssuerStats>;
  cacheInfo: CacheInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

import useSWR from "swr";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

/**
 * Hook to fetch cached issuer statistics for all issuers
 * Uses SWR for built-in caching and request deduplication
 * Cache is refreshed every 5 minutes on the server
 */
export function useIssuerStats(): UseIssuerStatsResult {
  // 60s dedupe: stats are shared across Navbar, Hero, IssuerCards — SWR
  // collapses all of them into a single network request per minute.
  const { data, error, isLoading, mutate } = useSWR("/api/issuers/stats", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const stats: CachedIssuerStats[] = data?.stats || [];

  // Memoize the map creation so it doesn't recalculate on every render
  const statsMap = React.useMemo(() => {
    const map = new Map<string, CachedIssuerStats>();
    stats.forEach((stat) => {
      map.set(stat.ticker, stat);
    });
    return map;
  }, [stats]);

  return {
    stats,
    statsMap,
    cacheInfo: data?.cacheInfo || null,
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch: async () => { await mutate(); },
  };
}
