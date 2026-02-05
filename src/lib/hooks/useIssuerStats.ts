"use client";

import { useState, useEffect, useCallback } from "react";

export interface CachedIssuerStats {
  ticker: string;
  currentPrice: number;
  price1hChange: number | null;
  price24hChange: number | null;
  price7dChange: number | null;
  volume24h: number;
  holders: number;
  marketCap: number;
  circulatingSupply: number;
  cachedAt: string;
}

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

/**
 * Hook to fetch cached issuer statistics for all issuers
 * Uses the pre-computed cache from /api/issuers/stats
 * Cache is refreshed every 5 minutes on the server
 * 
 * Returns:
 * - stats: Array of all issuer stats
 * - statsMap: Map keyed by ticker for O(1) lookup
 * - cacheInfo: Metadata about the cache (count, last updated)
 * - isLoading: Loading state
 * - error: Error message if any
 * - refetch: Function to manually refetch
 */
export function useIssuerStats(): UseIssuerStatsResult {
  const [stats, setStats] = useState<CachedIssuerStats[]>([]);
  const [statsMap, setStatsMap] = useState<Map<string, CachedIssuerStats>>(new Map());
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/issuers/stats");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const fetchedStats: CachedIssuerStats[] = data.stats || [];
      setStats(fetchedStats);
      
      // Build a map for O(1) lookups by ticker
      const map = new Map<string, CachedIssuerStats>();
      fetchedStats.forEach((stat) => {
        map.set(stat.ticker, stat);
      });
      setStatsMap(map);
      
      setCacheInfo(data.cacheInfo || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch stats";
      setError(message);
      console.error("[useIssuerStats] Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    statsMap,
    cacheInfo,
    isLoading,
    error,
    refetch: fetchStats,
  };
}
