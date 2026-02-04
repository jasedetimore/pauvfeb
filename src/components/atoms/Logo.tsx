"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";

interface LogoProps {
  height?: number;
  color?: string;
  variant?: "default" | "dark";
}

/**
 * Logo component for Pauv branding
 * Displays the PAUV text logo with optional customization
 */
export function Logo({ 
  height = 30, 
  color,
  variant = "default" 
}: LogoProps) {
  const logoColor = color || (variant === "dark" ? colors.textDark : colors.gold);
  
  return (
    <div 
      style={{ 
        fontFamily: "monospace",
        fontWeight: 700,
        fontSize: `${height * 0.8}px`,
        color: logoColor,
        letterSpacing: "2px",
        lineHeight: 1,
      }}
    >
      PAUV
    </div>
  );
}
