"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";
import { HoldersSkeleton } from "@/components/atoms";

interface Holder {
  username: string;
  quantity: number;
  supplyPercentage: number;
}

interface HoldersSectionProps {
  holders: Holder[];
  isLoading?: boolean;
  onRefresh?: () => Promise<void> | void;
}

/**
 * HoldersSection - Displays a list of top holders for an issuer
 * Shows username, quantity held, and percentage of supply
 */
export const HoldersSection: React.FC<HoldersSectionProps> = ({
  holders,
  isLoading = false,
  onRefresh,
}) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Format numbers for display
  const formatQuantity = (qty: number): string => {
    if (qty >= 1000000) return `${(qty / 1000000).toFixed(2)}M`;
    if (qty >= 1000) return `${(qty / 1000).toFixed(2)}K`;
    return qty.toFixed(2);
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    await Promise.all([
      Promise.resolve(onRefresh()),
      new Promise((r) => setTimeout(r, 600)),
    ]);
    setIsRefreshing(false);
  };

  // Show full section skeleton when loading
  if (isLoading || isRefreshing) {
    return <HoldersSkeleton />;
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <h2
          className="font-mono text-lg font-semibold"
          style={{ color: colors.textPrimary }}
        >
          Top Holders
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

      {/* Holders Table */}
      <div
        className="p-3 rounded-[10px] overflow-hidden transition-colors"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        <div>
          <table className="min-w-full text-xs font-mono table-fixed">
            <thead className="text-sm" style={{ color: colors.textPrimary }}>
              <tr>
                <th className="text-left px-3 py-2 font-medium">User</th>
                <th className="text-right px-3 py-2 font-medium">Quantity</th>
                <th className="text-right px-3 py-2 font-medium">Supply</th>
              </tr>
            </thead>
            <tbody>
              {holders.length === 0 ? (
                // No holders message
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-10 text-center"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.boxOutline}40` }}>
                        <svg className="w-4 h-4 opacity-50" style={{ color: colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>No holders yet</p>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>Be the first to get listed.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Render holders
                holders.slice(0, 10).map((holder, i) => (
                  <tr
                    key={i}
                    className="transition-colors"
                    style={{
                      backgroundColor: i % 2 === 0 ? "transparent" : colors.boxLight,
                    }}
                  >
                    <td
                      className="px-2 py-2 truncate max-w-[110px]"
                      style={{ color: colors.textPrimary }}
                    >
                      {holder.username}
                    </td>
                    <td
                      className="px-3 py-2 text-right"
                      style={{ color: colors.textPrimary }}
                    >
                      {formatQuantity(holder.quantity)}
                    </td>
                    <td
                      className="px-3 py-2 text-right"
                      style={{ color: colors.textSecondary }}
                    >
                      {holder.supplyPercentage.toFixed(2)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
