"use client";

import React from "react";
import Link from "next/link";
import { ViewToggle, ViewMode, SortButton, SortMode } from "../atoms";
import { colors } from "@/lib/constants/colors";

interface NavigationProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  showSortButtons?: boolean;
}

const ITEM_HEIGHT = "26px";

/**
 * Navigation - Single-row bar containing view toggle, request button, sort label, and sort buttons.
 * All items share the same height and sit in one horizontal line.
 */
export function Navigation({
  viewMode,
  onViewModeChange,
  sortMode,
  onSortModeChange,
  showSortButtons = true,
}: NavigationProps) {
  const sortOptions: { mode: SortMode; label: string }[] = [
    { mode: "biggest", label: "Biggest Names" },
    { mode: "trending", label: "Trending" },
    { mode: "newest", label: "Newest" },
    { mode: "alphabetical", label: "Alphabetical" },
  ];

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        borderRadius: "6px",
        padding: "3px 7px",
        overflow: "hidden",
      }}
    >
      {/* View Toggle (desktop only) */}
      <div className="hidden md:flex" style={{ height: ITEM_HEIGHT }}>
        <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>

      {/* Request Button (desktop only) */}
      <Link
        href="/list-yourself"
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
          padding: "0 14px",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
          height: ITEM_HEIGHT,
        }}
      >
        Request to be an Issuer
      </Link>

      {/* Sort Label */}
      {showSortButtons && viewMode === "card" && (
        <span
          className="hidden md:flex font-mono"
          style={{
            color: colors.textMuted,
            fontSize: "12px",
            fontWeight: "500",
            alignItems: "center",
            height: ITEM_HEIGHT,
            whiteSpace: "nowrap",
          }}
        >
          Sort by:
        </span>
      )}

      {/* Sort Buttons */}
      {showSortButtons && viewMode === "card" &&
        sortOptions.map((option) => (
          <SortButton
            key={option.mode}
            label={option.label}
            isActive={sortMode === option.mode}
            onClick={() => onSortModeChange(option.mode)}
          />
        ))}
    </nav>
  );
}
