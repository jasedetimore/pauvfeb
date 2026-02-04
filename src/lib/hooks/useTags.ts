"use client";

import { useState, useEffect, useCallback } from "react";
import { TagItemData } from "@/components/atoms/TagItem";
import { TagsApiResponse } from "@/lib/types";

interface UseTagsResult {
  tags: TagItemData[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch tags from the API
 * Handles loading state, error handling, and caching
 */
export function useTags(): UseTagsResult {
  const [tags, setTags] = useState<TagItemData[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tags");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TagsApiResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setTags(data.tags);
      setTotal(data.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch tags";
      setError(message);
      console.error("Error fetching tags:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    tags,
    total,
    isLoading,
    error,
    refetch: fetchTags,
  };
}
