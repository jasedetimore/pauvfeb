"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "../atoms/Logo";
import { colors } from "@/lib/constants/colors";

interface SelectedTagInfo {
  name: string;
  description?: string | null;
  issuerCount: number;
  marketCap: number;
  photoUrl?: string | null;
}

interface HeroSectionProps {
  issuerCount?: number;
  marketCap?: number;
  marketCapChange?: number;
  selectedTag?: SelectedTagInfo | null;
}

/**
 * HeroSection - The top banner with Pauv branding and market summary
 * Shows on the home page with logo, tagline, and market data
 * When a tag is selected, shows tag name, description, and tag-specific stats
 */
export function HeroSection({
  issuerCount = 0,
  marketCap = 0,
  marketCapChange = 0,
  selectedTag = null,
}: HeroSectionProps) {
  const router = useRouter();
  const [heroImgLoaded, setHeroImgLoaded] = useState(false);

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

  // Determine which values to display
  const displayMarketCap = selectedTag ? selectedTag.marketCap : marketCap;
  const displayIssuerCount = selectedTag ? selectedTag.issuerCount : issuerCount;

  // Capitalize first letter helper
  const capitalize = (s: string) =>
    s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  // --- Tag selected: single combined banner ---
  if (selectedTag) {
    return (
      <div
        style={{
          margin: "20px",
          marginBottom: "8px",
          fontFamily: 'var(--font-fira-code), "Fira Code", monospace',
        }}
      >
        <div
          style={{
            position: "relative",
            background: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: "10px",
            minHeight: "177px",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* Back to Pauv link */}
          <button
            onClick={() => router.push("/")}
            style={{
              position: "absolute",
              top: "8px",
              left: "10px",
              zIndex: 4,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: colors.gold,
              fontSize: "12px",
              fontWeight: "500",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 4px",
              borderRadius: "4px",
              opacity: 0.85,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
            className="font-mono"
          >
            <span style={{ fontSize: "11px", lineHeight: 1 }}>←</span>
            Back to Pauv
          </button>

          {/* Center photo with fades on both sides */}
          {selectedTag.photoUrl && (
            /* Photo sits at 10:3, height = banner height, centered, background shows on sides */
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                aspectRatio: "10 / 3",
                zIndex: 1,
              }}
            >
              <img
                src={selectedTag.photoUrl}
                alt={selectedTag.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "fill",
                  display: "block",
                  opacity: heroImgLoaded ? 1 : 0,
                  transition: "opacity 0.25s ease-in",
                }}
                onLoad={() => setHeroImgLoaded(true)}
              />
              {/* Left fade — starts 10px outside the photo's left edge */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "-10px",
                  bottom: 0,
                  width: "calc(30% + 10px)",
                  background: `linear-gradient(to right, ${colors.background}, transparent)`,
                  zIndex: 2,
                }}
              />
              {/* Right fade — starts 10px outside the photo's right edge */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: "-10px",
                  bottom: 0,
                  width: "calc(30% + 10px)",
                  background: `linear-gradient(to left, ${colors.background}, transparent)`,
                  zIndex: 2,
                }}
              />
            </div>
          )}

          {/* Left side — tag info */}
          <div
            style={{
              position: "relative",
              zIndex: 3,
              flex: 1,
              padding: "20px",
              fontFamily: 'var(--font-fira-code), "Fira Code", monospace',
            }}
          >
            <div
              style={{
                color: colors.textPrimary,
                fontSize: "clamp(26px, 5vw, 42px)",
                fontWeight: "700",
                marginBottom: "2px",
                lineHeight: "1.1",
              }}
            >
              {capitalize(selectedTag.name)}
            </div>
            {selectedTag.description && (
              <div
                style={{
                  color: colors.textMuted,
                  fontSize: "clamp(13px, 2vw, 16px)",
                  fontWeight: "400",
                  marginBottom: "8px",
                  lineHeight: "1.3",
                }}
              >
                {selectedTag.description}
              </div>
            )}
            <div
              style={{
                color: colors.textMuted,
                fontSize: "14px",
                fontWeight: "400",
              }}
            >
              {displayIssuerCount.toLocaleString()} Issuers
            </div>
          </div>


        </div>
      </div>
    );
  }

  // --- No tag selected: original two-box layout ---
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        margin: "20px",
        marginBottom: "8px",
        fontFamily: 'var(--font-fira-code), "Fira Code", monospace',
      }}
    >
      {/* Left Box - Pauv Logo */}
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
            {displayIssuerCount.toLocaleString()} Issuers
          </div>
        </div>
      </div>


    </div>
  );
}
