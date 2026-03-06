"use client";

import useSWR from "swr";
import { IssuerCardData, IssuersApiResponse } from "@/lib/types";

interface UseIssuersOptions {
  tag?: string;
  limit?: number;
  offset?: number;
}

interface UseIssuersResult {
  issuers: IssuerCardData[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const fetchIssuersData = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

const fetchSingleIssuer = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) throw new Error("Issuer not found");
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

/**
 * Hook to fetch issuers from the API
 * Handles loading state, error handling, and caching via SWR
 */
export function useIssuers(options: UseIssuersOptions = {}): UseIssuersResult {
  const { tag, limit = 50, offset = 0 } = options;

  const params = new URLSearchParams();
  if (tag) params.set("tag", tag);
  params.set("limit", limit.toString());
  params.set("offset", offset.toString());

  const { data, error, isLoading, mutate } = useSWR(
    `/api/issuers?${params.toString()}`,
    fetchIssuersData,
    { dedupingInterval: 10000, revalidateOnFocus: false }
  );

  return {
    issuers: data?.issuers || [],
    total: data?.total || 0,
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch: async () => { await mutate() },
  };
}

/**
 * Hook to fetch a single issuer by ticker
 */
export function useIssuer(ticker: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    ticker ? `/api/issuers/${encodeURIComponent(ticker)}` : null,
    fetchSingleIssuer,
    { dedupingInterval: 10000, revalidateOnFocus: false }
  );

  return {
    issuer: data?.issuer || null,
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch: async () => { await mutate() },
  };
}
