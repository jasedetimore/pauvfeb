"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";
import { PercentageChange, TradingSummarySkeleton } from "@/components/atoms";

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
  /** When false the issuer has no issuer_trading row yet */
  isTradable?: boolean;
  onRefresh?: () => Promise<void> | void;
}

/**
 * TradingSummarySection - Displays key trading metrics for an issuer
 * Shows volume, supply, holders, market cap, and price changes
 */
export const TradingSummarySection: React.FC<TradingSummarySectionProps> = ({
  data,
  isLoading = false,
  isTradable = true,
  onRefresh,
}) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
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

  const formatSupply = (value?: number | null): string => {
    if (value == null) return "—";
    if (value >= 1000000000000) {
      return value.toExponential(4).replace("e+", "e");
    }
    if (value >= 1000000000) {
      return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const metrics = [
    { label: "24h Volume", value: isTradable ? formatCurrency(data?.volume24h) : "---" },
    { label: "Supply", value: isTradable ? formatSupply(data?.circulatingSupply) : "---" },
    { label: "Holders", value: isTradable ? formatNumber(data?.holders) : "---" },
    { label: "Invested", value: isTradable ? formatCurrency(data?.marketCap) : "---" },
  ];

  const priceChanges = [
    { label: "1h", value: data?.price1hChange },
    { label: "24h", value: data?.price24hChange },
    { label: "7d", value: data?.price7dChange },
  ];

  if (isLoading || isRefreshing) {
    return <TradingSummarySkeleton />;
  }

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    await Promise.all([
      Promise.resolve(onRefresh()),
      new Promise((r) => setTimeout(r, 600)),
    ]);
    setIsRefreshing(false);
  };

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
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs px-3 py-1 rounded transition-colors hover:opacity-80 disabled:opacity-50"
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
        <div className="grid grid-cols-2 gap-2">
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
          className="mt-2 pt-2 flex justify-between"
          style={{ borderTop: `1px solid ${colors.boxOutline}` }}
        >
          {priceChanges.map((change, i) => (
            <div key={i} className="text-center">
              <div
                className="text-xs font-light uppercase mb-0.5"
                style={{ color: colors.textSecondary }}
              >
                {change.label}
              </div>
              {!isTradable ? (
                <span
                  className="text-sm font-mono"
                  style={{ color: colors.textSecondary }}
                >
                  ---
                </span>
              ) : change.value != null ? (
                <PercentageChange value={change.value} size="lg" />
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
