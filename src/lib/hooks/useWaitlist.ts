"use client";

import useSWR from "swr";
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

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to fetch waitlist");
  }
  return res.json();
};

export function useWaitlist() {
  const { user, isLoading: authLoading } = useAuth();

  // If there's no user, SWR key is null, so it won't fetch
  const { data, error, isLoading, mutate } = useSWR<WaitlistData>(
    user && !authLoading ? "/api/waitlist" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  // Still loading if: auth is loading, or fetch is in-flight when user exists
  const stillLoading = authLoading || (!!user && isLoading);

  return {
    position: data?.position ?? null,
    referralCode: data?.referralCode ?? null,
    referralCount: data?.referralCount ?? 0,
    neighbors: data?.neighbors ?? [],
    isLoading: stillLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch: async () => { await mutate(); },
  };
}
