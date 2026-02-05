"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";

export interface IssuerCardProps {
  ticker: string;
  fullName: string;
  imageUrl?: string;
  currentPrice: number;
  priceChange: number;
  primaryTag?: string;
  backgroundColor?: string;
  hoverBackgroundColor?: string;
  onClick?: () => void;
}

/**
 * IssuerCard - Displays an issuer/stock card with price and change info
 * Used in the main grid to show individual issuers
 */
export function IssuerCard({
  ticker,
  fullName,
  imageUrl,
  currentPrice,
  priceChange,
  primaryTag,
  backgroundColor = colors.background,
  hoverBackgroundColor = colors.boxHover,
  onClick,
}: IssuerCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (str: string): string => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Get initials from full name
  const initials = fullName
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 3)
    .toUpperCase() || ticker.slice(0, 3).toUpperCase();

  // Format price based on value
  const formatPrice = (price: number): string => {
    if (!isFinite(price)) return "—";
    if (price >= 10000) {
      return `$${price.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
    }
    if (price >= 100) {
      return `$${price.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
    }
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 5, maximumFractionDigits: 5 })}`;
  };

  const isPositiveChange = priceChange >= 0;
  const changeColor = isPositiveChange ? colors.green : colors.red;

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: isHovered ? hoverBackgroundColor : backgroundColor,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        height: "132px",
        cursor: "pointer",
        transition: "all 0.2s",
        gap: "12px",
        padding: "12px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left side - Square image */}
      <div
        style={{
          width: "88px",
          height: "88px",
          backgroundColor: colors.textPrimary,
          flexShrink: 0,
          borderRadius: "5px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={`${ticker} logo`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <span
            style={{
              color: colors.textMuted,
              fontSize: "20px",
              fontWeight: "600",
            }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Right side - Information */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "88px",
        }}
      >
        {/* Top section */}
        <div>
          {/* Ticker */}
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: colors.gold,
              marginBottom: "5px",
              fontFamily: "monospace",
            }}
          >
            ${ticker}
          </div>

          {/* Stock Name */}
          <div
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: colors.textPrimary,
              marginBottom: "5px",
              lineHeight: "1.2",
              wordWrap: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {fullName}
          </div>

          {/* Industry/Tag */}
          <div
            style={{
              fontSize: "11px",
              color: colors.textMuted,
              fontWeight: "400",
            }}
          >
            {primaryTag ? capitalizeFirstLetter(primaryTag) : "—"}
          </div>
        </div>

        {/* Bottom section - Price and Change */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
          {/* Price */}
          <div
            style={{
              fontSize: "16px",
              fontWeight: "400",
              color: colors.textPrimary,
              letterSpacing: "-0.5px",
              flexShrink: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {formatPrice(currentPrice)}
          </div>

          {/* 24hr Change with triangle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3px",
              flexShrink: 0,
            }}
          >
            {/* Triangle indicator */}
            <span
              style={{
                width: 0,
                height: 0,
                borderLeft: "4px solid transparent",
                borderRight: "4px solid transparent",
                ...(isPositiveChange
                  ? { borderBottom: `5px solid ${colors.green}` }
                  : { borderTop: `5px solid ${colors.red}` }),
              }}
            />
            <div
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: changeColor,
                whiteSpace: "nowrap",
              }}
            >
              {isPositiveChange ? "+" : ""}
              {priceChange.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
