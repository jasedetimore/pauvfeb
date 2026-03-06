"use client";

import useSWR from "swr";
import { TagItemData } from "@/components/atoms/TagItem";
import { TagsApiResponse } from "@/lib/types";

interface UseTagsResult {
  tags: TagItemData[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  const data: TagsApiResponse = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

/**
 * Hook to fetch tags from the API
 * Uses SWR for built-in caching and request deduplication
 */
export function useTags(): UseTagsResult {
  // 60s dedupe: tags are static metadata shared across the main page
  // sidebar and hero — a single request serves all consumers.
  const { data, error, isLoading, mutate } = useSWR<TagsApiResponse>("/api/tags", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  return {
    tags: data?.tags || [],
    total: data?.total || 0,
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch: async () => { await mutate(); },
  };
}
