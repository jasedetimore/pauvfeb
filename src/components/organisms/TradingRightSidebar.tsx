"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";
import { TradingFormSimple } from "@/components/molecules";
import { SoapPaymentButton } from "../payments/SoapPaymentButton";

interface TradingRightSidebarProps {
  ticker: string;
  price?: number;
  isLoading?: boolean;
  onBuy?: (amount: number) => void;
  onSell?: (amount: number) => void;
}

/**
 * TradingRightSidebar - Right sidebar for the trading page
 * Contains the trading form for placing orders
 */
export const TradingRightSidebar: React.FC<TradingRightSidebarProps> = ({
  ticker,
  price,
  isLoading = false,
  onBuy,
  onSell,
}) => {
  return (
    <aside
      className="space-y-4"
      style={{ color: colors.textPrimary }}
    >
      {/* Trading Form */}
      <TradingFormSimple
        ticker={ticker}
        price={price}
        onBuy={onBuy}
        onSell={onSell}
        isLoading={isLoading}
        disabled={!price}
      />

      {/* Additional info card */}
      <div
        className="p-4 rounded-[10px]"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        <h3
          className="font-mono text-sm font-medium mb-3"
          style={{ color: colors.textPrimary }}
        >
          Account Balance
        </h3>
        <div className="mb-4">
          <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
            Need more credits to trade?
          </p>
          <SoapPaymentButton />
        </div>
        <h3
          className="font-mono text-sm font-medium mb-3"
          style={{ color: colors.textPrimary }}
        >
          About Trading
        </h3>
        <ul
          className="space-y-2 text-xs"
          style={{ color: colors.textSecondary }}
        >
          <li>• Prices update in real-time</li>
          <li>• No transaction fees</li>
          <li>• Instant order execution</li>
          <li>• Simulated trading only</li>
        </ul>
      </div>
    </aside>
  );
};
