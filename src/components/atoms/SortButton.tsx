"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";

export type SortMode = "biggest" | "trending" | "newest" | "alphabetical";

interface SortButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

/**
 * SortButton - A single sort option button
 */
export function SortButton({ label, isActive, onClick }: SortButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: isActive ? colors.textPrimary : "transparent",
        color: isActive ? colors.textDark : colors.textMuted,
        border: `1px solid ${colors.border}`,
        borderRadius: "8px",
        padding: "4px 12px",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}
