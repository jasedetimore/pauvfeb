"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";
import { PriceDisplay } from "@/components/atoms";
import { TradingSummarySection, RecommendedIssuers } from "@/components/molecules";

interface TradingData {
  volume24h?: number | null;
  circulatingSupply?: number | null;
  holders?: number | null;
  marketCap?: number | null;
  price1hChange?: number | null;
  price24hChange?: number | null;
  price7dChange?: number | null;
}

interface TradingLeftSidebarProps {
  ticker: string;
  price?: number | null;
  tradingData?: TradingData | null;
  isLoading?: boolean;
  /** When false the issuer has no issuer_trading row yet */
  isTradable?: boolean;
  onRefreshMetrics?: () => void;
  issuerTag?: string | null;
  /** Drives skeleton loaders for price + summary only (not recommended issuers) */
  postOrderRefreshing?: boolean;
}

/**
 * TradingLeftSidebar - Left sidebar for the trading page
 * Contains price display, trading summary, and recommended issuers
 */
export const TradingLeftSidebar: React.FC<TradingLeftSidebarProps> = ({
  ticker,
  price,
  tradingData,
  isLoading = false,
  isTradable = true,
  onRefreshMetrics,
  issuerTag,
  postOrderRefreshing = false,
}) => {
  return (
    <aside
      className="space-y-4"
      style={{ color: colors.textPrimary }}
    >
      {/* Price Display */}
      <PriceDisplay
        ticker={ticker}
        price={price}
        loading={isLoading || postOrderRefreshing}
        showBackButton={true}
        isTradable={isTradable}
      />

      {/* Trading Summary */}
      <TradingSummarySection
        data={tradingData}
        isLoading={isLoading || postOrderRefreshing}
        isTradable={isTradable}
        onRefresh={onRefreshMetrics}
      />

      {/* Recommended Issuers */}
      <RecommendedIssuers
        currentTicker={ticker}
        currentTag={issuerTag}
        forceSkeleton={isLoading}
      />
    </aside>
  );
};
