"use client";

import React from "react";
import Image from "next/image";

interface LogoProps {
  height?: number;
  variant?: "default" | "dark";
}

/**
 * Logo component for Pauv branding
 * Displays the gold PAUV logo image
 */
export function Logo({ 
  height = 30,
  variant = "default" 
}: LogoProps) {
  return (
    <Image
      src="/pauv_logo_black.png"
      alt="PAUV"
      width={height * 3}
      height={height}
      style={{ width: "auto", height: `${height}px` }}
      priority
    />
  );
}
