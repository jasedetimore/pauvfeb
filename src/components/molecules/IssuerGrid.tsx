"use client";

import React from "react";
import { IssuerCard, IssuerCardProps } from "../atoms/IssuerCard";
import { GetListedCard } from "../atoms/GetListedCard";
import { colors } from "@/lib/constants/colors";
import { IssuerData } from "@/lib/types";

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
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
      <GetListedCard />
    </div>
  );
}
