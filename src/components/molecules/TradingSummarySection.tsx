"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";
import { PercentageChange } from "@/components/atoms";

interface TradingSummaryData {
  volume24h?: number | null;
  circulatingSupply?: number | null;
  holders?: number | null;
  marketCap?: number | null;
  price1hChange?: number | null;
  price24hChange?: number | null;
  price7dChange?: number | null;
}

interface TradingSummarySectionProps {
  data?: TradingSummaryData | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

/**
 * TradingSummarySection - Displays key trading metrics for an issuer
 * Shows volume, supply, holders, market cap, and price changes
 */
export const TradingSummarySection: React.FC<TradingSummarySectionProps> = ({
  data,
  isLoading = false,
  onRefresh,
}) => {
  // Format currency values
  const formatCurrency = (value?: number | null): string => {
    if (value == null) return "—";
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  // Format number values
  const formatNumber = (value?: number | null): string => {
    if (value == null) return "—";
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  const metrics = [
    { label: "24h Volume", value: formatCurrency(data?.volume24h) },
    { label: "Circulating Supply", value: formatNumber(data?.circulatingSupply) },
    { label: "Holders", value: formatNumber(data?.holders) },
    { label: "Market Cap", value: formatCurrency(data?.marketCap) },
  ];

  const priceChanges = [
    { label: "1h", value: data?.price1hChange },
    { label: "24h", value: data?.price24hChange },
    { label: "7d", value: data?.price7dChange },
  ];

  if (isLoading) {
    return (
      <div
        className="p-4 rounded-[10px] animate-pulse"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div
                className="h-3 w-16 rounded"
                style={{ backgroundColor: colors.boxLight }}
              />
              <div
                className="h-5 w-24 rounded"
                style={{ backgroundColor: colors.boxLight }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <h2
          className="font-mono text-lg font-semibold"
          style={{ color: colors.textPrimary }}
        >
          Trading Summary
        </h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-xs px-3 py-1 rounded transition-colors"
            style={{
              backgroundColor: colors.background,
              border: `1px solid ${colors.boxOutline}`,
              color: colors.textPrimary,
            }}
          >
            Refresh
          </button>
        )}
      </div>

      {/* Metrics Grid */}
      <div
        className="p-4 rounded-[10px] transition-colors"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, i) => (
            <div key={i}>
              <div
                className="text-xs font-light uppercase"
                style={{ color: colors.textSecondary }}
              >
                {metric.label}
              </div>
              <div
                className="font-mono font-semibold text-lg"
                style={{ color: colors.textPrimary }}
              >
                {metric.value}
              </div>
            </div>
          ))}
        </div>

        {/* Price Changes */}
        <div
          className="mt-4 pt-4 flex justify-between"
          style={{ borderTop: `1px solid ${colors.boxOutline}` }}
        >
          {priceChanges.map((change, i) => (
            <div key={i} className="text-center">
              <div
                className="text-xs font-light uppercase mb-1"
                style={{ color: colors.textSecondary }}
              >
                {change.label}
              </div>
              {change.value != null ? (
                <PercentageChange value={change.value} size="sm" />
              ) : (
                <span
                  className="text-sm font-mono"
                  style={{ color: colors.textSecondary }}
                >
                  —
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
