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
        color: isActive ? colors.textDark : colors.textPrimary,
        border: `1px solid ${colors.border}`,
        borderRadius: "8px",
        padding: "4px 11px",
        fontSize: "11px",
        fontWeight: isActive ? "600" : "400",
        cursor: "pointer",
        transition: "all 0.2s",
        whiteSpace: "nowrap",
        height: "26px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {label}
    </button>
  );
}
