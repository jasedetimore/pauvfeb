"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";
import { MainPageTemplate } from "@/components/templates";
import { useIssuers, useTags, useIssuerStats, useImagePreloader } from "@/lib/hooks";
import { IssuerData } from "@/components/molecules/IssuerGrid";
import { IssuerListData } from "@/components/molecules/IssuerListView";
import { TagItemData } from "@/components/atoms/TagItem";
import { HomePageSkeleton, TagPageSkeleton } from "@/components/atoms";

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
  const { stats, statsMap, isLoading: statsLoading } = useIssuerStats();

  // Compute total market cap from cached stats (sum of total_usdp per issuer)
  const totalMarketCap = useMemo(() => {
    return stats.reduce((sum, s) => sum + (s.marketCap || 0), 0);
  }, [stats]);

  // Transform DB issuers to include market data from cache (or mark as not tradable)
  const issuersWithMarketData: IssuerData[] = useMemo(() => {
    return dbIssuers.map((issuer) => {
      const cachedStats = statsMap.get(issuer.ticker);
      
      // Use cached stats if available — issuer is on issuer_trading
      if (cachedStats && cachedStats.currentPrice > 0) {
        return {
          ticker: issuer.ticker,
          fullName: issuer.fullName,
          imageUrl: issuer.imageUrl,
          currentPrice: cachedStats.currentPrice,
          priceChange: cachedStats.price24hChange ?? 0,
          primaryTag: issuer.primaryTag,
          isTradable: true,
        };
      }
      
      // No cached stats — issuer is on issuer_details but not issuer_trading
      return {
        ticker: issuer.ticker,
        fullName: issuer.fullName,
        imageUrl: issuer.imageUrl,
        currentPrice: 0,
        priceChange: 0,
        primaryTag: issuer.primaryTag,
        isTradable: false,
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
          isTradable: true,
        };
      }
      
      // Not on issuer_trading yet
      return {
        ticker: issuer.ticker,
        fullName: issuer.fullName,
        primaryTag: issuer.primaryTag,
        currentPrice: 0,
        price1hChange: 0,
        price24hChange: 0,
        price7dChange: 0,
        volume24h: 0,
        holders: 0,
        marketCap: 0,
        isTradable: false,
      };
    });
  }, [dbIssuers, statsMap]);

  // Sort issuers by different criteria using cached stats
  const biggestIssuers = useMemo(() => {
    return [...issuersWithMarketData].sort((a, b) => {
      const aStats = statsMap.get(a.ticker);
      const bStats = statsMap.get(b.ticker);
      const aMarket = aStats?.marketCap ?? 0;
      const bMarket = bStats?.marketCap ?? 0;
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
  // Fires GA4 event with issuer_id, issuer_name, tag_name, current_price, market_cap
  const handleIssuerClick = (issuer: IssuerData) => {
    const cachedStats = statsMap.get(issuer.ticker);
    sendGAEvent('event', 'issuer_card_click', {
      issuer_id: issuer.ticker,
      issuer_name: issuer.fullName,
      tag_name: issuer.primaryTag || 'none',
      source: 'home_grid',
      current_price: issuer.currentPrice ?? 0,
      market_cap: cachedStats?.marketCap ?? 0,
    });
    router.push(`/issuer/${issuer.ticker.toLowerCase()}`);
  };

  // Handle issuer click (list view)
  const handleListIssuerClick = (issuer: IssuerListData) => {
    sendGAEvent('event', 'issuer_card_click', {
      issuer_id: issuer.ticker,
      issuer_name: issuer.fullName,
      tag_name: issuer.primaryTag || 'none',
      source: 'home_list',
      current_price: issuer.currentPrice ?? 0,
      market_cap: issuer.marketCap ?? 0,
    });
    router.push(`/issuer/${issuer.ticker.toLowerCase()}`);
  };

  // Handle tag selection - navigate to /{tagname}
  const handleTagSelect = (tag: TagItemData) => {
    // If the same tag is already selected, deselect and go home
    if (selectedTagId === tag.id) {
      setSelectedTagId(null);
      router.push("/");
    } else {
      setSelectedTagId(tag.id);
      router.push(`/${tag.name.toLowerCase()}`);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    // TODO: navigate to search results
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

  // Preload the Pauv logo so it's instantly visible when skeleton clears
  const logoReady = useImagePreloader(["/pauv_logo_black.png"], 3000);
  const showSkeleton = tagsLoading || combinedLoading || !logoReady;

  if (showSkeleton) {
    return selectedTagId ? <TagPageSkeleton /> : <HomePageSkeleton />;
  }

  return (
    <MainPageTemplate
      // Market summary data
      issuerCount={dbIssuers.length}
      marketCap={totalMarketCap}
      marketCapChange={0}
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
