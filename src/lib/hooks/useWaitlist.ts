"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

export interface WaitlistNeighbor {
  position: number;
  username: string;
  userId: string;
  isCurrentUser: boolean;
}

export interface WaitlistData {
  position: number;
  referralCode: string | null;
  referralCount: number;
  neighbors: WaitlistNeighbor[];
}

export function useWaitlist() {
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<WaitlistData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchWaitlist = useCallback(async () => {
    if (!user) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to fetch waitlist");
      }
      const json: WaitlistData = await res.json();
      setData(json);
      hasFetchedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchWaitlist();
    }
  }, [authLoading, fetchWaitlist]);

  // Still loading if: auth is loading, fetch is in-flight, or user exists but we haven't fetched yet
  const stillLoading = authLoading || isLoading || (!!user && !hasFetchedRef.current && !data);

  return {
    /** User's waitlist position (null while loading or unauthenticated) */
    position: data?.position ?? null,
    /** Unique referral code for this user (e.g. PV-ABC123) */
    referralCode: data?.referralCode ?? null,
    /** Number of successful referrals */
    referralCount: data?.referralCount ?? 0,
    /** Neighbor rows including the user (2 above, self, 2 below) */
    neighbors: data?.neighbors ?? [],
    isLoading: stillLoading,
    error,
    /** Re-fetch waitlist data */
    refetch: fetchWaitlist,
  };
}
