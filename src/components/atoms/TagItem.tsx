"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";

export interface TagItemData {
  id: string;
  name: string;
  issuerCount: number;
  marketCap: number;
  description?: string | null;
  photoUrl?: string | null;
}

interface TagItemProps {
  tag: TagItemData;
  isSelected?: boolean;
  isLast?: boolean;
  onClick?: () => void;
}

/**
 * TagItem - A single tag in the sidebar navigation
 * Shows tag name, issuer count, and market cap
 */
export function TagItem({ 
  tag, 
  isSelected = false, 
  isLast = false,
  onClick 
}: TagItemProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  // Format market cap
  const formatMarketCap = (value: number): string => {
    if (!isFinite(value)) return "—";
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: isSelected || isHovered ? colors.boxHover : "transparent",
        border: isSelected ? `1px solid ${colors.gold}` : "none",
        borderBottom: !isLast && !isSelected ? `1px solid ${colors.border}` : (isSelected ? `1px solid ${colors.gold}` : "none"),
        borderRadius: isSelected ? "5px" : "0",
        padding: "8px 11px",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tag name */}
      <div
        style={{
          color: colors.textPrimary,
          fontSize: "16px",
          fontWeight: "700",
          marginBottom: "6px",
        }}
      >
        {tag.name}
      </div>

      {/* Bottom row: Issuers on left, Mkt Cap on right */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Issuers count */}
        <div
          style={{
            color: colors.textMuted,
            fontSize: "12px",
          }}
        >
          {tag.issuerCount} Issuers
        </div>

        {/* Market cap */}
        <div
          style={{
            color: colors.green,
            fontSize: "14px",
            fontWeight: "700",
          }}
        >
          {formatMarketCap(tag.marketCap)}
        </div>
      </div>
    </div>
  );
}
