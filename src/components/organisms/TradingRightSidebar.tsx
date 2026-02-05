"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";
import { TradingFormSimple, UserHoldings } from "@/components/molecules";

interface TradingRightSidebarProps {
  ticker: string;
  price?: number;
  priceStep?: number;
  isLoading?: boolean;
  onBuy?: (amount: number) => void;
  onSell?: (amount: number) => void;
}

/**
 * TradingRightSidebar - Right sidebar for the trading page
 * Contains the trading form for placing orders and user holdings
 */
export const TradingRightSidebar: React.FC<TradingRightSidebarProps> = ({
  ticker,
  price,
  priceStep,
  isLoading = false,
  onBuy,
  onSell,
}) => {
  return (
    <aside
      className="space-y-2"
      style={{ color: colors.textPrimary }}
    >
      {/* Trading Form */}
      <TradingFormSimple
        ticker={ticker}
        price={price}
        priceStep={priceStep}
        onBuy={onBuy}
        onSell={onSell}
        isLoading={isLoading}
        disabled={!price}
      />

      {/* User Holdings */}
      <UserHoldings ticker={ticker} />
    </aside>
  );
};
