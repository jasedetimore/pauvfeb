"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";

interface Holder {
  username: string;
  quantity: number;
  supplyPercentage: number;
}

interface HoldersSectionProps {
  holders: Holder[];
  isLoading?: boolean;
  onRefresh?: () => void;
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
  // Format numbers for display
  const formatQuantity = (qty: number): string => {
    if (qty >= 1000000) return `${(qty / 1000000).toFixed(2)}M`;
    if (qty >= 1000) return `${(qty / 1000).toFixed(2)}K`;
    return qty.toFixed(2);
  };

  const HolderSkeleton = () => (
    <tr className="animate-pulse">
      <td className="px-3 py-2">
        <div
          className="h-3 rounded w-20"
          style={{ backgroundColor: colors.boxLight }}
        />
      </td>
      <td className="px-3 py-2">
        <div
          className="h-3 rounded w-14"
          style={{ backgroundColor: colors.boxLight }}
        />
      </td>
      <td className="px-3 py-2">
        <div
          className="h-3 rounded w-12"
          style={{ backgroundColor: colors.boxLight }}
        />
      </td>
    </tr>
  );

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

      {/* Holders Table */}
      <div
        className="p-3 rounded-[10px] overflow-hidden transition-colors"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        <div className="overflow-x-auto overflow-y-auto max-h-72">
          <table className="min-w-full text-xs font-mono">
            <thead style={{ color: colors.textSecondary }}>
              <tr>
                <th className="text-left px-3 py-2 font-medium">User</th>
                <th className="text-right px-3 py-2 font-medium">Quantity</th>
                <th className="text-right px-3 py-2 font-medium">Supply</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Show skeletons when loading
                Array.from({ length: 5 }).map((_, i) => (
                  <HolderSkeleton key={i} />
                ))
              ) : holders.length === 0 ? (
                // No holders message
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-8 text-center"
                    style={{ color: colors.textSecondary }}
                  >
                    No holders yet
                  </td>
                </tr>
              ) : (
                // Render holders
                holders.map((holder, i) => (
                  <tr
                    key={i}
                    className="transition-colors"
                    style={{
                      backgroundColor: i % 2 === 0 ? "transparent" : colors.boxLight,
                    }}
                  >
                    <td
                      className="px-3 py-2 truncate max-w-[140px]"
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
