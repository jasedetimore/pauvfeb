"use client";

import React from "react";
import Image from "next/image";

interface LogoProps {
  height?: number;
  variant?: "default" | "dark";
}

/**
 * Logo component for Pauv branding
 * Displays the gold or dark PAUV logo image based on variant
 */
export function Logo({ 
  height = 30,
  variant = "default" 
}: LogoProps) {
  const src = variant === "dark" ? "/pauv_logo_black.png" : "/pauv_logo_gold.png";

  return (
    <Image
      src={src}
      alt="PAUV"
      width={height * 3}
      height={height}
      style={{ width: "auto", height: `${height}px` }}
      priority
    />
  );
}
