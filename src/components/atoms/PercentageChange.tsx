"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";

interface PercentageChangeProps {
  value: number;
  className?: string;
  showSign?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * PercentageChange - Displays a percentage change value with color coding
 * Green for positive, red for negative
 */
export const PercentageChange: React.FC<PercentageChangeProps> = ({
  value,
  className = "",
  showSign = true,
  size = "md",
}) => {
  const isPositive = value >= 0;
  const color = isPositive ? colors.green : colors.red;
  
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const formattedValue = Math.abs(value).toFixed(2);
  const sign = showSign ? (isPositive ? "+" : "-") : "";

  return (
    <span
      className={`font-mono ${sizeClasses[size]} ${className}`}
      style={{ color }}
    >
      {sign}{formattedValue}%
    </span>
  );
};
