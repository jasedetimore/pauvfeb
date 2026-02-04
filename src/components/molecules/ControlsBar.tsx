"use client";

import React from "react";
import { ViewToggle, ViewMode, SortButton, SortMode } from "../atoms";
import { colors } from "@/lib/constants/colors";

interface ControlsBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  showSortButtons?: boolean;
}

/**
 * ControlsBar - View toggle and sort controls for the issuer listing
 */
export function ControlsBar({
  viewMode,
  onViewModeChange,
  sortMode,
  onSortModeChange,
  showSortButtons = true,
}: ControlsBarProps) {
  const sortOptions: { mode: SortMode; label: string }[] = [
    { mode: "biggest", label: "Biggest Names" },
    { mode: "trending", label: "Trending" },
    { mode: "newest", label: "Newest" },
    { mode: "alphabetical", label: "Alphabetical" },
  ];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "8px",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {/* Left: View Toggle and Request Button */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {/* View Toggle (desktop only) */}
        <div className="hidden md:flex">
          <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>

        {/* Request Button (desktop only) */}
        <button
          className="hidden md:flex font-mono"
          style={{
            backgroundColor: colors.background,
            color: colors.textPrimary,
            fontSize: "11px",
            fontWeight: "500",
            border: `1px solid ${colors.border}`,
            borderRadius: "8px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            padding: "8px 16px",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          Request to be an Issuer
        </button>

        {/* Sort Label */}
        {showSortButtons && viewMode === "card" && (
          <span
            className="hidden md:flex font-mono"
            style={{
              color: colors.textMuted,
              fontSize: "12px",
              fontWeight: "500",
              alignItems: "center",
            }}
          >
            Sort by:
          </span>
        )}

        {/* Sort Buttons */}
        {showSortButtons && viewMode === "card" && (
          <div
            className="flex gap-2 overflow-x-auto max-md:pt-0 max-md:pb-0 pb-0 md:pb-2"
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "nowrap",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {sortOptions.map((option) => (
              <SortButton
                key={option.mode}
                label={option.label}
                isActive={sortMode === option.mode}
                onClick={() => onSortModeChange(option.mode)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
