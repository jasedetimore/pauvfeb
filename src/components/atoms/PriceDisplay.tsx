"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/constants/colors";
import { Skeleton } from "./Skeleton";

// ChevronLeft icon component (inline SVG to avoid external dependency)
const ChevronLeftIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

interface PriceDisplayProps {
  price?: number | null;
  ticker?: string;
  loading?: boolean;
  showBackButton?: boolean;
}

/**
 * PriceDisplay - Shows the current price of an issuer
 * Used in the trading page sidebar
 */
export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  ticker,
  loading,
  showBackButton = true,
}) => {
  const router = useRouter();

  // Format price with appropriate decimal places
  const formatPrice = (value: number): string => {
    if (!isFinite(value)) return "—";
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8,
    })}`;
  };

  // Show skeleton when loading
  if (loading && price == null) {
    return (
      <div>
        {showBackButton && (
          <div className="flex items-center justify-between mb-2 px-1">
            <Skeleton width="100px" height="1.5rem" />
          </div>
        )}
        <div
          className="p-4 rounded-[10px]"
          style={{
            backgroundColor: colors.navbarBg,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div
            className="text-xs uppercase opacity-60"
            style={{ color: colors.textPrimary }}
          >
            Current Price
          </div>
          <Skeleton width="70%" height="2rem" className="mt-2" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {showBackButton && (
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-lg font-mono font-medium hover:opacity-80 transition-opacity uppercase"
            style={{ color: colors.gold }}
          >
            <ChevronLeftIcon size={18} />
            ${ticker}
          </button>
        </div>
      )}

      <div
        className="p-4 pb-2 rounded-[10px] transition-colors hover:opacity-90"
        style={{
          backgroundColor: colors.navbarBg,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div
          className="font-light text-xs uppercase opacity-90"
          style={{ color: colors.textPrimary }}
        >
          Current Price
        </div>
        <div
          className="font-mono font-bold truncate text-[1.5rem] md:text-[1.7rem]"
          style={{ color: colors.textPrimary }}
        >
          {price != null ? formatPrice(price) : "—"}
        </div>
      </div>
    </div>
  );
};
