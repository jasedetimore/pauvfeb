"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";
import { PriceDisplay } from "@/components/atoms";
import { TradingSummarySection, HoldersSection } from "@/components/molecules";

interface Holder {
  username: string;
  quantity: number;
  supplyPercentage: number;
}

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
  holders: Holder[];
  isLoading?: boolean;
  /** When false the issuer has no issuer_trading row yet */
  isTradable?: boolean;
  onRefreshMetrics?: () => void;
  onRefreshHolders?: () => void;
}

/**
 * TradingLeftSidebar - Left sidebar for the trading page
 * Contains price display, social links, trading summary, and holders
 */
export const TradingLeftSidebar: React.FC<TradingLeftSidebarProps> = ({
  ticker,
  price,
  tradingData,
  holders,
  isLoading = false,
  isTradable = true,
  onRefreshMetrics,
  onRefreshHolders,
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
        loading={isLoading}
        showBackButton={true}
        isTradable={isTradable}
      />

      {/* Trading Summary */}
      <TradingSummarySection
        data={tradingData}
        isLoading={isLoading}
        isTradable={isTradable}
        onRefresh={onRefreshMetrics}
      />

      {/* Top Holders */}
      <HoldersSection
        holders={holders}
        isLoading={isLoading}
        onRefresh={onRefreshHolders}
      />
    </aside>
  );
};
