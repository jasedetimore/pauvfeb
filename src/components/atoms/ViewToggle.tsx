"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";

export type ViewMode = "card" | "list";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

/**
 * ViewToggle - Toggle between card and list view modes
 */
export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div
      style={{
        border: `1px solid ${colors.border}`,
        borderRadius: "8px",
        overflow: "hidden",
        display: "flex",
      }}
    >
      {/* Card View Button */}
      <button
        onClick={() => onViewModeChange("card")}
        style={{
          backgroundColor: viewMode === "card" ? colors.textPrimary : "transparent",
          color: viewMode === "card" ? colors.textDark : colors.textMuted,
          border: "none",
          padding: "8px 20px",
          cursor: "pointer",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title="Card View"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      </button>

      {/* List View Button */}
      <button
        onClick={() => onViewModeChange("list")}
        style={{
          backgroundColor: viewMode === "list" ? colors.textPrimary : "transparent",
          color: viewMode === "list" ? colors.textDark : colors.textMuted,
          border: "none",
          borderLeft: `1px solid ${colors.border}`,
          padding: "8px 20px",
          cursor: "pointer",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title="List View"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      </button>
    </div>
  );
}
