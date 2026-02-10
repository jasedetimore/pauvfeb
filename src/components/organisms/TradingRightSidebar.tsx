"use client";

import React, { useState, useCallback, useEffect } from "react";
import { colors } from "@/lib/constants/colors";
import { TradingFormSimple } from "@/components/molecules";
import { SoapPaymentButton } from "../payments/SoapPaymentButton";
import { TradingFormSimple, UserHoldings, HoldersSection } from "@/components/molecules";

interface TradingRightSidebarProps {
  ticker: string;
  price?: number;
  priceStep?: number;
  isLoading?: boolean;
  /** When false the issuer has no issuer_trading row yet */
  isTradable?: boolean;
  onBuy?: (amount: number) => void;
  onSell?: (amount: number) => void;
  onOrderComplete?: () => void;
  onTransactionRefetchRef?: (refetch: () => Promise<void>) => void;
  holders?: { username: string; quantity: number; supplyPercentage: number }[];
  onRefreshHolders?: () => void;
  /** Fires once when all child sections have finished their initial fetch */
  onReady?: () => void;
}

/**
 * TradingRightSidebar - Right sidebar for the trading page
 * Contains the trading form for placing orders and user holdings.
 *
 * Coordinates skeleton loading so that UserHoldings, RecommendedIssuers,
 * and the TradingForm all transition from skeleton → content at the same
 * time — whichever finishes last gates the reveal for the others.
 */
export const TradingRightSidebar: React.FC<TradingRightSidebarProps> = ({
  ticker,
  price,
  priceStep,
  isLoading = false,
  isTradable = true,
  onBuy,
  onSell,
  onOrderComplete,
  onTransactionRefetchRef,
  holders = [],
  onRefreshHolders,
  onReady,
}) => {
  // Track when each child section finishes its own data fetch.
  const [holdingsLoading, setHoldingsLoading] = useState(true);

  const handleHoldingsLoadingChange = useCallback((loading: boolean) => {
    setHoldingsLoading(loading);
  }, []);

  // Report readiness to parent once child finishes its initial fetch
  const childrenReady = !holdingsLoading;
  const reportedRef = React.useRef(false);
  useEffect(() => {
    if (childrenReady && !reportedRef.current) {
      reportedRef.current = true;
      onReady?.();
    }
  }, [childrenReady, onReady]);

  // All children stay in skeleton until the parent says ready AND every
  // child has finished its own fetch.
  const childrenSkeleton = isLoading || !childrenReady;

  return (
    <aside
      className="space-y-4"
      style={{ color: colors.textPrimary }}
    >
      {/* Trading Form */}
      <TradingFormSimple
        ticker={ticker}
        price={price}
        priceStep={priceStep}
        onBuy={onBuy}
        onSell={onSell}
        onOrderComplete={onOrderComplete}
        isLoading={childrenSkeleton}
        disabled={!price || !isTradable}
        isTradable={isTradable}
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
      {/* User Holdings */}
      <UserHoldings
        ticker={ticker}
        onRefetchRef={onTransactionRefetchRef}
        forceSkeleton={childrenSkeleton}
        onLoadingChange={handleHoldingsLoadingChange}
      />

      {/* Top Holders */}
      <HoldersSection
        holders={holders}
        isLoading={childrenSkeleton}
        onRefresh={onRefreshHolders}
      />
    </aside>
  );
};
