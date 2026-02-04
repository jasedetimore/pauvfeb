"use client";

import React from "react";
import { Logo } from "../atoms/Logo";
import { colors } from "@/lib/constants/colors";

interface HeroSectionProps {
  issuerCount?: number;
  marketCap?: number;
  marketCapChange?: number;
}

/**
 * HeroSection - The top banner with Pauv branding and market summary
 * Shows on the home page with logo, tagline, and market data
 */
export function HeroSection({
  issuerCount = 0,
  marketCap = 0,
  marketCapChange = 0,
}: HeroSectionProps) {
  // Format market cap
  const formatMarketCap = (value: number): string => {
    if (!isFinite(value)) return "—";
    if (value >= 1_000_000_000_000) {
      return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
    }
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

  const isPositiveChange = marketCapChange >= 0;

  return (
    <div style={{ display: "flex", gap: "10px", margin: "20px", marginBottom: "8px" }}>
      {/* Left Box - Pauv Logo and Tagline */}
      <div
        style={{
          flex: "3",
          background: colors.gold,
          border: `1px solid ${colors.border}`,
          borderRadius: "10px",
          padding: "20px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          minHeight: "177px",
        }}
      >
        {/* Logo placeholder - in real app would be an image */}
        <div
          style={{
            maxHeight: "65px",
            width: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Logo height={50} variant="dark" />
        </div>

        <div className="font-mono">
          <div
            style={{
              color: colors.textDark,
              fontSize: "clamp(16px, 5vw, 23px)",
              fontWeight: "500",
              marginBottom: "6px",
              lineHeight: "1.1",
            }}
          >
            Invest in people.
          </div>
          <div
            style={{
              color: colors.border,
              fontSize: "14px",
              fontWeight: "400",
            }}
          >
            {issuerCount.toLocaleString()} Issuers
          </div>
        </div>
      </div>

      {/* Right Box - Market Cap (desktop only) */}
      <div
        className="hidden lg:flex"
        style={{
          flex: "1",
          background: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: "10px",
          padding: "20px",
          alignItems: "center",
          justifyContent: "flex-end",
          minHeight: "177px",
        }}
      >
        <div className="font-mono" style={{ textAlign: "right" }}>
          <div
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "14px",
              marginBottom: "3px",
              fontWeight: "400",
            }}
          >
            Market Cap
          </div>
          <div
            style={{
              color: colors.textPrimary,
              fontSize: "47px",
              fontWeight: "700",
              marginBottom: "8px",
              lineHeight: "1",
            }}
          >
            {formatMarketCap(marketCap)}
          </div>
          <div
            style={{
              color: isPositiveChange ? colors.green : colors.red,
              fontSize: "18px",
              fontWeight: "700",
            }}
          >
            {isPositiveChange ? "+" : ""}
            {marketCapChange.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}
