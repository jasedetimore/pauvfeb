"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";
import { IssuerHeader, IssuerTagsCard } from "@/components/molecules";

interface IssuerData {
  ticker: string;
  name: string;
  imageUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  tags?: string[];
}

interface TradingMainContentProps {
  issuer: IssuerData;
  isLoading?: boolean;
  children?: React.ReactNode; // For chart component
}

/**
 * TradingMainContent - Main content area for the trading page
 * Contains issuer header, chart, and tags
 */
export const TradingMainContent: React.FC<TradingMainContentProps> = ({
  issuer,
  isLoading = false,
  children,
}) => {
  return (
    <main className="space-y-0" style={{ color: colors.textPrimary }}>
      {/* Issuer Header */}
      <IssuerHeader
        ticker={issuer.ticker}
        name={issuer.name}
        imageUrl={issuer.imageUrl}
        headline={issuer.headline}
        bio={issuer.bio}
        tags={issuer.tags}
        isLoading={isLoading}
      />

      {/* Chart Area (passed as children) */}
      <div className="mt-4">
        {children ? (
          children
        ) : (
          <div
            className="h-[350px] rounded-[10px] flex items-center justify-center"
            style={{
              backgroundColor: "#000000",
            }}
          >
            <span style={{ color: colors.textSecondary }}>
              Chart coming soon
            </span>
          </div>
        )}
      </div>
    </main>
  );
};
