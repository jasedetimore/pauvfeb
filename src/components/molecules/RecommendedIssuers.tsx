"use client";

import React, { useState, useEffect, useMemo } from "react";
import { colors } from "@/lib/constants/colors";
import { IssuerCard, RecommendedIssuersSkeleton } from "@/components/atoms";
import { IssuerCardData } from "@/lib/types/issuer";
import { useIssuers } from "@/lib/hooks/useIssuers";
import { useIssuerStats } from "@/lib/hooks/useIssuerStats";

interface RecommendedIssuersProps {
  /** Current issuer ticker to exclude from recommendations */
  currentTicker: string;
  /** Tag of the current issuer to find similar ones */
  currentTag?: string | null;
  /** Force skeleton for unified initial loading */
  forceSkeleton?: boolean;
  /** Report loading state to parent for coordinated loading */
  onLoadingChange?: (isLoading: boolean) => void;
}

/**
 * RecommendedIssuers - Shows 3 recommended issuer cards
 * Prioritizes issuers sharing the same tag as the current issuer.
 * Falls back to additional issuers if fewer than 3 share the tag.
 */
export const RecommendedIssuers: React.FC<RecommendedIssuersProps> = ({
  currentTicker,
  currentTag,
  forceSkeleton = false,
  onLoadingChange,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use SWR hooks to automatically deduplicate overlapping requests
  const { issuers: tagIssuers, isLoading: tagLoading, refetch: refetchTag } = useIssuers({
    tag: currentTag ?? undefined,
    limit: 20
  });
  const { issuers: allIssuers, isLoading: allLoading, refetch: refetchAll } = useIssuers({
    limit: 50
  });
  const { statsMap, isLoading: statsLoading, refetch: refetchStats } = useIssuerStats();

  const isDataLoading = forceSkeleton || tagLoading || allLoading || statsLoading || isRefreshing;

  // Reactively compute recommendations
  const issuers = useMemo(() => {
    // 1. Filter out the current issuer
    let candidates = tagIssuers.filter(i => i.ticker.toUpperCase() !== currentTicker.toUpperCase());

    // 2. If we have fewer than 3 same-tag issuers, fetch all issuers to fill
    if (candidates.length < 3 && allIssuers.length > 0) {
      const existingTickers = new Set(candidates.map(c => c.ticker.toUpperCase()));
      const extras = allIssuers.filter(
        i => i.ticker.toUpperCase() !== currentTicker.toUpperCase() && !existingTickers.has(i.ticker.toUpperCase())
      );
      candidates = [...candidates, ...extras];
    }

    // 3. Take up to 3 in deterministic API order
    const selected = candidates.slice(0, 3);

    // 4. Enrich with price data from stats
    return selected.map(issuer => {
      const stat = statsMap.get(issuer.ticker);
      return {
        ...issuer,
        currentPrice: stat?.currentPrice ?? issuer.currentPrice ?? 0,
        priceChange: stat?.price24hChange ?? issuer.priceChange ?? 0,
        isTradable: Boolean(stat),
      };
    });
  }, [tagIssuers, allIssuers, statsMap, currentTicker]);

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isDataLoading);
    }
  }, [isDataLoading, onLoadingChange]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchTag(), refetchAll(), refetchStats()]);
    setIsRefreshing(false);
  };

  if (isDataLoading && issuers.length === 0) {
    return <RecommendedIssuersSkeleton />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2
          className="font-mono text-lg font-semibold"
          style={{ color: colors.textPrimary }}
        >
          Recommended Issuers
        </h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-xs px-3 py-1 rounded transition-colors hover:opacity-80 disabled:opacity-50"
          style={{
            backgroundColor: colors.background,
            border: `1px solid ${colors.boxOutline}`,
            color: colors.textPrimary,
          }}
          title="Refresh recommendations"
        >
          Refresh
        </button>
      </div>

      <div
        className="rounded-[10px] overflow-hidden"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        {issuers.length === 0 ? (
          <div
            className="text-center py-6 text-sm"
            style={{ color: colors.textSecondary }}
          >
            No recommendations available
          </div>
        ) : (
          <div>
            {issuers.map((issuer, index) => (
              <div
                key={issuer.ticker}
                style={{
                  borderBottom:
                    index < issuers.length - 1
                      ? `1px solid ${colors.boxOutline}`
                      : undefined,
                }}
              >
                <IssuerCard
                  ticker={issuer.ticker}
                  fullName={issuer.fullName}
                  imageUrl={issuer.imageUrl}
                  currentPrice={issuer.currentPrice}
                  priceChange={issuer.priceChange}
                  primaryTag={issuer.primaryTag}
                  isTradable={issuer.isTradable}
                  backgroundColor={colors.box}
                  hoverBackgroundColor={colors.boxHover}
                  variant="list"
                  onClick={() => {
                    window.location.href = `/issuer/${encodeURIComponent(issuer.ticker.toLowerCase())}`;
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
