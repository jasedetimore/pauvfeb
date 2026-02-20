"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/constants/colors";

/**
 * GetListedCard - CTA card appended to the end of every issuer grid.
 * Matches the visual style of IssuerCard but prompts new users to sign up.
 */
export function GetListedCard() {
  const router = useRouter();
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      onClick={() => router.push("/list-yourself")}
      style={{
        backgroundColor: isHovered ? colors.boxHover : colors.background,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        height: "112px",
        cursor: "pointer",
        transition: "all 0.2s",
        gap: "12px",
        padding: "12px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: "flex", gap: "12px", flex: 1, alignItems: "stretch" }}>
        {/* Left side - Generic profile icon */}
        <div
          style={{
            width: "88px",
            aspectRatio: "1",
            backgroundColor: colors.box,
            flexShrink: 0,
            borderRadius: "5px",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Simple person silhouette using SVG */}
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="8" r="4" fill={colors.textMuted} />
            <path
              d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
              fill={colors.textMuted}
            />
          </svg>
        </div>

        {/* Right side - CTA text */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "2px",
            paddingTop: "1px",
            paddingBottom: "1px",
          }}
        >
          {/* Ticker-style label */}
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: colors.gold,
              fontFamily: "monospace",
            }}
          >
            $YOU
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            {/* Name */}
            <div
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: colors.textPrimary,
                lineHeight: "1.2",
              }}
            >
              This Could Be You
            </div>

            {/* Tag-style subtitle */}
            <div
              style={{
                fontSize: "11px",
                color: colors.textMuted,
                fontWeight: "400",
              }}
            >
              Get listed on Pauv for free
            </div>
          </div>

          {/* Bottom CTA text */}
          <div
            style={{
              fontSize: "13px",
              fontWeight: "700",
              color: colors.gold,
              whiteSpace: "nowrap",
            }}
          >
            Apply Now →
          </div>
        </div>
      </div>
    </div>
  );
}
