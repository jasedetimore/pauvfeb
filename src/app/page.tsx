"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MainPageTemplate } from "@/components/templates";
import { mockMarketSummary } from "@/lib/mock-data";
import { useIssuers, useTags, useIssuerStats } from "@/lib/hooks";
import { IssuerData } from "@/components/molecules/IssuerGrid";
import { IssuerListData } from "@/components/molecules/IssuerListView";
import { TagItemData } from "@/components/atoms/TagItem";

/**
 * Generate fallback mock market data for an issuer
 * Used when cached stats are not available yet
 */
function generateFallbackMarketData(ticker: string) {
  // Use ticker to seed random but consistent values
  const seed = ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number) => {
    const x = Math.sin(seed) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };
  
  return {
    currentPrice: random(50, 500),
    priceChange: random(-15, 25),
    price1hChange: random(-5, 5),
    price7dChange: random(-20, 30),
    volume24h: Math.floor(random(1000000, 25000000)),
    holders: Math.floor(random(10000, 100000)),
    marketCap: Math.floor(random(100000000, 1200000000)),
  };
}

/**
 * Home Page - Main landing page for Pauv
 * Displays the issuer marketplace with filtering and sorting
 * Uses cached stats (refreshed every 5 minutes) for price/volume data
 */
export default function Home() {
  const router = useRouter();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // Fetch tags from Supabase
  const {
    tags,
    isLoading: tagsLoading,
    error: tagsError,
  } = useTags();

  const selectedTagName = useMemo(() => {
    if (!selectedTagId) return null;
    const found = tags.find((tag) => tag.id === selectedTagId);
    return found?.name ?? null;
  }, [selectedTagId, tags]);
  
  // Fetch issuers from Supabase
  const { issuers: dbIssuers, isLoading, error } = useIssuers({
    tag: selectedTagName ?? undefined,
  });

  // Fetch cached issuer stats (price, volume, etc.)
  const { statsMap, isLoading: statsLoading } = useIssuerStats();

  // Transform DB issuers to include market data from cache (or fallback)
  const issuersWithMarketData: IssuerData[] = useMemo(() => {
    return dbIssuers.map((issuer) => {
      const cachedStats = statsMap.get(issuer.ticker);
      
      // Use cached stats if available, otherwise fallback to mock data
      if (cachedStats && cachedStats.currentPrice > 0) {
        return {
          ticker: issuer.ticker,
          fullName: issuer.fullName,
          imageUrl: issuer.imageUrl,
          currentPrice: cachedStats.currentPrice,
          priceChange: cachedStats.price24hChange ?? 0,
          primaryTag: issuer.primaryTag,
        };
      }
      
      // Fallback to generated data if cache is empty
      const fallbackData = generateFallbackMarketData(issuer.ticker);
      return {
        ticker: issuer.ticker,
        fullName: issuer.fullName,
        imageUrl: issuer.imageUrl,
        currentPrice: fallbackData.currentPrice,
        priceChange: fallbackData.priceChange,
        primaryTag: issuer.primaryTag,
      };
    });
  }, [dbIssuers, statsMap]);

  // Create list view data with extended market info from cache
  const listViewIssuers: IssuerListData[] = useMemo(() => {
    return dbIssuers.map((issuer) => {
      const cachedStats = statsMap.get(issuer.ticker);
      
      // Use cached stats if available
      if (cachedStats && cachedStats.currentPrice > 0) {
        return {
          ticker: issuer.ticker,
          fullName: issuer.fullName,
          primaryTag: issuer.primaryTag,
          currentPrice: cachedStats.currentPrice,
          price1hChange: cachedStats.price1hChange ?? 0,
          price24hChange: cachedStats.price24hChange ?? 0,
          price7dChange: cachedStats.price7dChange ?? 0,
          volume24h: cachedStats.volume24h,
          holders: cachedStats.holders,
          marketCap: cachedStats.marketCap,
        };
      }
      
      // Fallback to generated data if cache is empty
      const fallbackData = generateFallbackMarketData(issuer.ticker);
      return {
        ticker: issuer.ticker,
        fullName: issuer.fullName,
        primaryTag: issuer.primaryTag,
        currentPrice: fallbackData.currentPrice,
        price1hChange: fallbackData.price1hChange,
        price24hChange: fallbackData.priceChange,
        price7dChange: fallbackData.price7dChange,
        volume24h: fallbackData.volume24h,
        holders: fallbackData.holders,
        marketCap: fallbackData.marketCap,
      };
    });
  }, [dbIssuers, statsMap]);

  // Sort issuers by different criteria using cached stats
  const biggestIssuers = useMemo(() => {
    return [...issuersWithMarketData].sort((a, b) => {
      const aStats = statsMap.get(a.ticker);
      const bStats = statsMap.get(b.ticker);
      const aMarket = aStats?.marketCap ?? generateFallbackMarketData(a.ticker).marketCap;
      const bMarket = bStats?.marketCap ?? generateFallbackMarketData(b.ticker).marketCap;
      return bMarket - aMarket;
    });
  }, [issuersWithMarketData, statsMap]);

  const trendingIssuers = useMemo(() => {
    return [...issuersWithMarketData].sort((a, b) => b.priceChange - a.priceChange);
  }, [issuersWithMarketData]);

  const newestIssuers = useMemo(() => {
    // For now, reverse alphabetical as "newest" - will update with created_at later
    return [...issuersWithMarketData].reverse();
  }, [issuersWithMarketData]);

  const alphabeticalIssuers = useMemo(() => {
    return [...issuersWithMarketData].sort((a, b) =>
      a.fullName.localeCompare(b.fullName)
    );
  }, [issuersWithMarketData]);

  // Handle issuer click (card view) - navigate to issuer trading page
  const handleIssuerClick = (issuer: IssuerData) => {
    router.push(`/issuer/${issuer.ticker.toLowerCase()}`);
  };

  // Handle issuer click (list view)
  const handleListIssuerClick = (issuer: IssuerListData) => {
    router.push(`/issuer/${issuer.ticker.toLowerCase()}`);
  };

  // Handle tag selection
  const handleTagSelect = (tag: TagItemData) => {
    setSelectedTagId((prev) => (prev === tag.id ? null : tag.id));
  };

  // Handle search
  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // In a real app: navigate to search results
  };

  // Log error if any
  if (error) {
    console.error("Error loading issuers:", error);
  }

  if (tagsError) {
    console.error("Error loading tags:", tagsError);
  }

  // Combined loading state - show loading while fetching issuers or stats
  const combinedLoading = isLoading || statsLoading;

  return (
    <MainPageTemplate
      // Market summary data
      issuerCount={mockMarketSummary.totalIssuers}
      marketCap={mockMarketSummary.totalMarketCap}
      marketCapChange={mockMarketSummary.marketCapChange}
      tags={tags}
      tagsLoading={tagsLoading}
      // Issuers for card view (by sort mode) - from Supabase with cached stats
      biggestIssuers={biggestIssuers}
      trendingIssuers={trendingIssuers}
      newestIssuers={newestIssuers}
      alphabeticalIssuers={alphabeticalIssuers}
      // Issuers for list view - from Supabase with cached stats
      listViewIssuers={listViewIssuers}
      issuersLoading={combinedLoading}
      // Auth state (not authenticated by default)
      isAuthenticated={false}
      // Callbacks
      onIssuerClick={handleIssuerClick}
      onListIssuerClick={handleListIssuerClick}
      onTagSelect={handleTagSelect}
      onSearch={handleSearch}
    />
  );
}
