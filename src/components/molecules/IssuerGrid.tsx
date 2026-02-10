"use client";

import React from "react";
import { IssuerCard, IssuerCardProps } from "../atoms/IssuerCard";
import { colors } from "@/lib/constants/colors";

export interface IssuerData {
  ticker: string;
  fullName: string;
  imageUrl?: string;
  currentPrice: number;
  priceChange: number;
  primaryTag?: string;
  /** false when issuer has no issuer_trading row yet */
  isTradable?: boolean;
}

interface IssuerGridProps {
  issuers: IssuerData[];
  isLoading?: boolean;
  onIssuerClick?: (issuer: IssuerData) => void;
}

/**
 * IssuerGrid - Responsive grid of issuer cards
 * Displays issuers in a 1/2/3 column layout depending on screen size
 */
export function IssuerGrid({
  issuers,
  isLoading = false,
  onIssuerClick,
}: IssuerGridProps) {
  if (isLoading) {
    return (
      <div
        className="col-span-full text-sm text-center py-8"
        style={{ color: colors.textSecondary }}
      >
        Loading...
      </div>
    );
  }

  if (issuers.length === 0) {
    return (
      <div
        className="col-span-full text-sm text-center py-8"
        style={{ color: colors.textSecondary }}
      >
        No issuers found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
      {issuers.map((issuer) => (
        <IssuerCard
          key={issuer.ticker}
          ticker={issuer.ticker}
          fullName={issuer.fullName}
          imageUrl={issuer.imageUrl}
          currentPrice={issuer.currentPrice}
          priceChange={issuer.priceChange}
          primaryTag={issuer.primaryTag}
          isTradable={issuer.isTradable}
          onClick={() => onIssuerClick?.(issuer)}
        />
      ))}
    </div>
  );
}
