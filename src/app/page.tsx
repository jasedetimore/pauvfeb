"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MainPageTemplate } from "@/components/templates";
import { mockMarketSummary } from "@/lib/mock-data";
import { useIssuers, useTags } from "@/lib/hooks";
import { IssuerData } from "@/components/molecules/IssuerGrid";
import { IssuerListData } from "@/components/molecules/IssuerListView";
import { TagItemData } from "@/components/atoms/TagItem";

/**
 * Generate mock market data for an issuer
 * This simulates price/volume data until we have real market data
 */
function generateMockMarketData(ticker: string) {
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

  // Transform DB issuers to include mock market data
  const issuersWithMarketData: IssuerData[] = useMemo(() => {
    return dbIssuers.map((issuer) => {
      const marketData = generateMockMarketData(issuer.ticker);
      return {
        ticker: issuer.ticker,
        fullName: issuer.fullName,
        imageUrl: issuer.imageUrl,
        currentPrice: marketData.currentPrice,
        priceChange: marketData.priceChange,
        primaryTag: issuer.primaryTag,
      };
    });
  }, [dbIssuers]);

  // Create list view data with extended market info
  const listViewIssuers: IssuerListData[] = useMemo(() => {
    return dbIssuers.map((issuer) => {
      const marketData = generateMockMarketData(issuer.ticker);
      return {
        ticker: issuer.ticker,
        fullName: issuer.fullName,
        primaryTag: issuer.primaryTag,
        currentPrice: marketData.currentPrice,
        price1hChange: marketData.price1hChange,
        price24hChange: marketData.priceChange,
        price7dChange: marketData.price7dChange,
        volume24h: marketData.volume24h,
        holders: marketData.holders,
        marketCap: marketData.marketCap,
      };
    });
  }, [dbIssuers]);

  // Sort issuers by different criteria
  const biggestIssuers = useMemo(() => {
    return [...issuersWithMarketData].sort((a, b) => {
      const aMarket = generateMockMarketData(a.ticker).marketCap;
      const bMarket = generateMockMarketData(b.ticker).marketCap;
      return bMarket - aMarket;
    });
  }, [issuersWithMarketData]);

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

  return (
    <MainPageTemplate
      // Market summary data
      issuerCount={mockMarketSummary.totalIssuers}
      marketCap={mockMarketSummary.totalMarketCap}
      marketCapChange={mockMarketSummary.marketCapChange}
      tags={tags}
      tagsLoading={tagsLoading}
      // Issuers for card view (by sort mode) - from Supabase
      biggestIssuers={biggestIssuers}
      trendingIssuers={trendingIssuers}
      newestIssuers={newestIssuers}
      alphabeticalIssuers={alphabeticalIssuers}
      // Issuers for list view - from Supabase
      listViewIssuers={listViewIssuers}
      issuersLoading={isLoading}
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
