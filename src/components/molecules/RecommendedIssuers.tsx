"use client";

import React, { useState, useEffect } from "react";
import { colors } from "@/lib/constants/colors";
import { IssuerCard, RecommendedIssuersSkeleton } from "@/components/atoms";
import { IssuerCardData } from "@/lib/types/issuer";
import { CachedIssuerStats } from "@/app/api/issuers/stats/route";

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
 * Falls back to random issuers if none share the tag.
 */
export const RecommendedIssuers: React.FC<RecommendedIssuersProps> = ({
  currentTicker,
  currentTag,
  forceSkeleton = false,
  onLoadingChange,
}) => {
  const [issuers, setIssuers] = useState<Array<IssuerCardData & { isTradable?: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);

        // Fetch issuers and stats in parallel
        const tagParam = currentTag ? `?tag=${encodeURIComponent(currentTag)}&limit=20` : "?limit=20";
        const [issuersRes, statsRes] = await Promise.all([
          fetch(`/api/issuers${tagParam}`),
          fetch("/api/issuers/stats"),
        ]);

        if (cancelled) return;

        const issuersData = await issuersRes.json();
        const statsData = await statsRes.json();

        if (cancelled) return;

        // Build a stats lookup map
        const statsMap = new Map<string, CachedIssuerStats>();
        if (statsData.stats) {
          for (const s of statsData.stats) {
            statsMap.set(s.ticker, s);
          }
        }

        // Filter out the current issuer
        let candidates: IssuerCardData[] = (issuersData.issuers || [])
          .filter((i: IssuerCardData) => i.ticker.toUpperCase() !== currentTicker.toUpperCase());

        // If we have fewer than 3 same-tag issuers, fetch all issuers to fill
        if (candidates.length < 3) {
          const allRes = await fetch("/api/issuers?limit=50");
          if (!cancelled) {
            const allData = await allRes.json();
            const existingTickers = new Set(candidates.map((c: IssuerCardData) => c.ticker.toUpperCase()));
            const extras = (allData.issuers || []).filter(
              (i: IssuerCardData) =>
                i.ticker.toUpperCase() !== currentTicker.toUpperCase() &&
                !existingTickers.has(i.ticker.toUpperCase())
            );
            // Shuffle extras for randomness
            for (let i = extras.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [extras[i], extras[j]] = [extras[j], extras[i]];
            }
            candidates = [...candidates, ...extras];
          }
        }

        // Take up to 3
        const selected = candidates.slice(0, 3);

        // Enrich with price data from stats
        const enriched = selected.map((issuer: IssuerCardData) => {
          const stat = statsMap.get(issuer.ticker);
          return {
            ...issuer,
            currentPrice: stat?.currentPrice ?? issuer.currentPrice ?? 0,
            priceChange: stat?.price24hChange ?? issuer.priceChange ?? 0,
            isTradable: Boolean(stat),
          };
        });

        if (!cancelled) {
          setIssuers(enriched);
        }
      } catch (err) {
        console.error("[RecommendedIssuers] Error fetching recommendations:", err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchRecommendations();

    return () => {
      cancelled = true;
    };
  }, [currentTicker, currentTag]);

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  const effectiveLoading = forceSkeleton || isLoading;

  if (effectiveLoading) {
    return <RecommendedIssuersSkeleton />;
  }

  return (
    <div>
      {/* Divider */}
      <div
        className="my-3"
        style={{
          height: "1px",
          backgroundColor: colors.boxOutline,
        }}
      />

      <h2
        className="font-mono text-lg font-semibold mb-3"
        style={{ color: colors.textPrimary }}
      >
        Recommended Issuers
      </h2>

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
