"use client";

import { useState, useEffect, useCallback } from "react";
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

/**
 * Hook to fetch issuers from the API
 * Handles loading state, error handling, and caching
 */
export function useIssuers(options: UseIssuersOptions = {}): UseIssuersResult {
  const { tag, limit = 50, offset = 0 } = options;
  
  const [issuers, setIssuers] = useState<IssuerCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIssuers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (tag) params.set("tag", tag);
      params.set("limit", limit.toString());
      params.set("offset", offset.toString());

      const response = await fetch(`/api/issuers?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: IssuersApiResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setIssuers(data.issuers);
      setTotal(data.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch issuers";
      setError(message);
      console.error("Error fetching issuers:", err);
    } finally {
      setIsLoading(false);
    }
  }, [tag, limit, offset]);

  useEffect(() => {
    fetchIssuers();
  }, [fetchIssuers]);

  return {
    issuers,
    total,
    isLoading,
    error,
    refetch: fetchIssuers,
  };
}

/**
 * Hook to fetch a single issuer by ticker
 */
export function useIssuer(ticker: string | null) {
  const [issuer, setIssuer] = useState<IssuerCardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssuer = useCallback(async () => {
    if (!ticker) {
      setIssuer(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/issuers/${encodeURIComponent(ticker)}`);
      
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

      setIssuer(data.issuer);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch issuer";
      setError(message);
      console.error("Error fetching issuer:", err);
    } finally {
      setIsLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    fetchIssuer();
  }, [fetchIssuer]);

  return {
    issuer,
    isLoading,
    error,
    refetch: fetchIssuer,
  };
}
