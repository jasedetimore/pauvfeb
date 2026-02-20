"use client";

import { useMemo, useState, use } from "react";
import { useRouter } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";
import { MainPageTemplate } from "@/components/templates";
import { useIssuers, useTags, useIssuerStats, useImagePreloader } from "@/lib/hooks";
import { IssuerData, IssuerListData } from "@/lib/types";
import { TagItemData } from "@/components/atoms/TagItem";
import { TagPageSkeleton } from "@/components/atoms";

/**
 * Tag Page - Shows issuers filtered by a specific tag
 * URL: /{tagname} (e.g. /athlete, /musician)
 * Displays the tag name, description, filtered issuers, and tag-specific market cap
 */
export default function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: tagSlug } = use(params);
  const router = useRouter();

  // Fetch tags from Supabase
  const {
    tags,
    isLoading: tagsLoading,
    error: tagsError,
  } = useTags();

  // Find the current tag by matching the URL slug to the tag name
  const currentTag = useMemo(() => {
    return (
      tags.find((t) => t.name.toLowerCase() === tagSlug.toLowerCase()) ?? null
    );
  }, [tags, tagSlug]);

  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // Sync selectedTagId from currentTag once tags are loaded
  const effectiveTagId = currentTag?.id ?? selectedTagId;

  // Fetch issuers filtered by this tag
  const { issuers: dbIssuers, isLoading, error } = useIssuers({
    tag: currentTag?.name ?? tagSlug,
  });

  // Fetch cached issuer stats (price, volume, etc.)
  const { stats, statsMap, isLoading: statsLoading } = useIssuerStats();

  // Compute tag-specific market cap from filtered issuers' cached stats
  const tagMarketCap = useMemo(() => {
    return dbIssuers.reduce((sum, issuer) => {
      const cachedStats = statsMap.get(issuer.ticker);
      if (cachedStats) {
        return sum + (cachedStats.marketCap || 0);
      }
      return sum;
    }, 0);
  }, [dbIssuers, statsMap]);

  // Build the selectedTag info object for the HeroSection
  // While tags are still loading, use the URL slug as a placeholder so the
  // hero doesn't flash back to default Pauv branding between tag navigations
  const selectedTagInfo = useMemo(() => {
    if (currentTag) {
      return {
        name: currentTag.name,
        description: currentTag.description,
        issuerCount: dbIssuers.length,
        marketCap: tagMarketCap,
        photoUrl: currentTag.photoUrl,
      };
    }
    // Tags still loading — show a placeholder from the URL slug
    return {
      name: tagSlug,
      description: null,
      issuerCount: dbIssuers.length,
      marketCap: tagMarketCap,
      photoUrl: null as string | null,
    };
  }, [currentTag, dbIssuers.length, tagMarketCap, tagSlug]);

  // Transform DB issuers to include market data from cache (or fallback)
  const issuersWithMarketData: IssuerData[] = useMemo(() => {
    return dbIssuers.map((issuer) => {
      const cachedStats = statsMap.get(issuer.ticker);

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

  // Sort issuers by different criteria
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
    return [...issuersWithMarketData].sort(
      (a, b) => b.priceChange - a.priceChange
    );
  }, [issuersWithMarketData]);

  const newestIssuers = useMemo(() => {
    return [...issuersWithMarketData].reverse();
  }, [issuersWithMarketData]);

  const alphabeticalIssuers = useMemo(() => {
    return [...issuersWithMarketData].sort((a, b) =>
      a.fullName.localeCompare(b.fullName)
    );
  }, [issuersWithMarketData]);

  // Handle issuer click (card view)
  const handleIssuerClick = (issuer: IssuerData) => {
    const cachedStats = statsMap.get(issuer.ticker);
    sendGAEvent('event', 'issuer_card_click', {
      issuer_id: issuer.ticker,
      issuer_name: issuer.fullName,
      tag_name: issuer.primaryTag || currentTag?.name || tagSlug,
      source: 'tag_page',
      current_price: issuer.currentPrice ?? 0,
      market_cap: cachedStats?.marketCap ?? 0,
    });
    router.push(`/issuer/${issuer.ticker.toLowerCase()}`);
  };

  // Handle issuer click (list view)
  const handleListIssuerClick = (issuer: IssuerListData) => {
    const cachedStats = statsMap.get(issuer.ticker);
    sendGAEvent('event', 'issuer_card_click', {
      issuer_id: issuer.ticker,
      issuer_name: issuer.fullName,
      tag_name: issuer.primaryTag || currentTag?.name || tagSlug,
      source: 'tag_list',
      current_price: issuer.currentPrice ?? 0,
      market_cap: cachedStats?.marketCap ?? 0,
    });
    router.push(`/issuer/${issuer.ticker.toLowerCase()}`);
  };

  // Handle tag selection - navigate to new tag or back to home
  const handleTagSelect = (tag: TagItemData) => {
    if (effectiveTagId === tag.id) {
      // Deselect - go back to home
      setSelectedTagId(null);
      router.push("/");
    } else {
      // Select different tag
      setSelectedTagId(tag.id);
      router.push(`/${tag.name.toLowerCase()}`);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    // TODO: navigate to search results
  };

  const combinedLoading = isLoading || statsLoading;
  const dataLoaded = !tagsLoading && !combinedLoading;

  // Collect image URLs for the hero banner + first visible cards (above the fold)
  // Default sort is "biggest", so use biggestIssuers order
  // Only preload the hero photo + first 9 cards (3x3 grid)
  const imageUrls = useMemo(() => {
    const urls: string[] = [];
    if (selectedTagInfo?.photoUrl) urls.push(selectedTagInfo.photoUrl);
    const visibleIssuers = biggestIssuers.slice(0, 9);
    visibleIssuers.forEach((issuer) => {
      if (issuer.imageUrl) urls.push(issuer.imageUrl);
    });
    return urls;
  }, [selectedTagInfo, biggestIssuers]);

  // Keep skeleton visible until all images are preloaded (or 3s timeout)
  const imagesReady = useImagePreloader(imageUrls, 3000);
  const showSkeleton = !dataLoaded || (imageUrls.length > 0 && !imagesReady);

  if (showSkeleton) {
    return <TagPageSkeleton />;
  }

  if (error) {
    console.error("Error loading issuers:", error);
  }
  if (tagsError) {
    console.error("Error loading tags:", tagsError);
  }

  return (
    <MainPageTemplate
      // Market summary data
      issuerCount={dbIssuers.length}
      marketCap={tagMarketCap}
      marketCapChange={0}
      tags={tags}
      tagsLoading={tagsLoading}
      // Tag selection
      selectedTag={selectedTagInfo}
      initialTagId={effectiveTagId}
      // Issuers for card view
      biggestIssuers={biggestIssuers}
      trendingIssuers={trendingIssuers}
      newestIssuers={newestIssuers}
      alphabeticalIssuers={alphabeticalIssuers}
      // Issuers for list view
      listViewIssuers={listViewIssuers}
      issuersLoading={combinedLoading}
      // Auth state
      isAuthenticated={false}
      // Callbacks
      onIssuerClick={handleIssuerClick}
      onListIssuerClick={handleListIssuerClick}
      onTagSelect={handleTagSelect}
      onSearch={handleSearch}
    />
  );
}
