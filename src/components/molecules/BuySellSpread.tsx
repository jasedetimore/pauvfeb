"use client";

import React, { useMemo } from "react";
import { colors } from "@/lib/constants/colors";

interface BuySellSpreadProps {
  buyPercentage: number;
  sellPercentage: number;
  buyVolume?: number;
  sellVolume?: number;
  buyOrders?: number;
  sellOrders?: number;
  isLoading?: boolean;
  className?: string;
}

/**
 * BuySellSpread - Visual indicator of buy/sell pressure
 * Shows a bar with green (buy) and red (sell) percentages
 */
export const BuySellSpread: React.FC<BuySellSpreadProps> = ({
  buyPercentage,
  sellPercentage,
  buyVolume,
  sellVolume,
  buyOrders,
  sellOrders,
  isLoading = false,
  className = "",
}) => {
  const hasData = buyPercentage + sellPercentage > 0;

  // Ensure we show at least 1% for either side if there's data
  const buyWidth = hasData ? Math.max(buyPercentage, 1) : 50;
  const sellWidth = hasData ? Math.max(sellPercentage, 1) : 50;

  // Format volume for display
  const formatVolume = (vol?: number): string => {
    if (!vol) return "0";
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toFixed(0);
  };

  if (isLoading) {
    return (
      <div
        className={`p-4 rounded-lg animate-pulse ${className}`}
        style={{ backgroundColor: colors.box }}
      >
        <div
          className="h-2 rounded-lg w-full"
          style={{ backgroundColor: colors.boxLight }}
        />
        <div className="flex justify-between mt-3">
          <div
            className="h-4 w-20 rounded"
            style={{ backgroundColor: colors.boxLight }}
          />
          <div
            className="h-4 w-20 rounded"
            style={{ backgroundColor: colors.boxLight }}
          />
        </div>
      </div>
    );
  }

  return (
    <section
      className={`rounded-lg p-4 transition-colors ${className}`}
      style={{ backgroundColor: colors.box }}
    >
      <div className="relative">
        {/* Progress Bar */}
        <div
          className="flex h-2 rounded-lg overflow-hidden"
          style={{ backgroundColor: colors.boxLight }}
        >
          {hasData ? (
            <>
              <div
                className="transition-all duration-300"
                style={{
                  width: `${buyWidth}%`,
                  backgroundColor: colors.green,
                }}
              />
              <div
                className="transition-all duration-300"
                style={{
                  width: `${sellWidth}%`,
                  backgroundColor: colors.red,
                }}
              />
            </>
          ) : (
            <div
              className="w-full flex items-center justify-center text-xs"
              style={{
                backgroundColor: colors.textSecondary,
                color: colors.textPrimary,
              }}
            >
              No data
            </div>
          )}
        </div>

        {/* Labels */}
        {hasData ? (
          <div className="space-y-1 mt-2">
            <div className="flex justify-between text-xs font-mono">
              <div style={{ color: colors.green }}>
                {buyPercentage.toFixed(1)}% Buy
              </div>
              <div style={{ color: colors.red }} className="text-right">
                {sellPercentage.toFixed(1)}% Sell
              </div>
            </div>
            {(buyOrders !== undefined || sellOrders !== undefined) && (
              <div
                className="flex justify-between text-xs"
                style={{ color: colors.textSecondary }}
              >
                <div>
                  {buyOrders || 0} orders ({formatVolume(buyVolume)} vol.)
                </div>
                <div className="text-right">
                  {sellOrders || 0} orders ({formatVolume(sellVolume)} vol.)
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex justify-center mt-3 text-xs"
            style={{ color: colors.textSecondary }}
          >
            Waiting for market data...
          </div>
        )}
      </div>
    </section>
  );
};
