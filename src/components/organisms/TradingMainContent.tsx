"use client";

import React, { useState } from "react";
import { colors } from "@/lib/constants/colors";
import { IssuerHeader, IssuerTagsCard, BuySellSpread } from "@/components/molecules";

interface IssuerData {
  ticker: string;
  name: string;
  imageUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  tags?: string[];
}

interface BuySellData {
  buyPercentage: number;
  sellPercentage: number;
  buyVolume?: number;
  sellVolume?: number;
  buyOrders?: number;
  sellOrders?: number;
}

interface TradingMainContentProps {
  issuer: IssuerData;
  buySellData?: BuySellData;
  isLoading?: boolean;
  children?: React.ReactNode; // For chart component
}

/**
 * TradingMainContent - Main content area for the trading page
 * Contains issuer header, chart, buy/sell spread, and tags
 */
export const TradingMainContent: React.FC<TradingMainContentProps> = ({
  issuer,
  buySellData,
  isLoading = false,
  children,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "news">("overview");

  return (
    <main className="space-y-4" style={{ color: colors.textPrimary }}>
      {/* Issuer Header */}
      <IssuerHeader
        ticker={issuer.ticker}
        name={issuer.name}
        imageUrl={issuer.imageUrl}
        headline={issuer.headline}
        bio={issuer.bio}
        isLoading={isLoading}
      />

      {/* Tags */}
      {issuer.tags && issuer.tags.length > 0 && (
        <IssuerTagsCard tags={issuer.tags} isLoading={isLoading} />
      )}

      {/* Tab Navigation */}
      <div
        className="flex gap-4 border-b"
        style={{ borderColor: colors.boxOutline }}
      >
        <button
          onClick={() => setActiveTab("overview")}
          className="pb-2 px-1 font-mono text-sm transition-colors relative"
          style={{
            color:
              activeTab === "overview"
                ? colors.gold
                : colors.textSecondary,
          }}
        >
          Overview
          {activeTab === "overview" && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: colors.gold }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("news")}
          className="pb-2 px-1 font-mono text-sm transition-colors relative"
          style={{
            color:
              activeTab === "news" ? colors.gold : colors.textSecondary,
          }}
        >
          News
          {activeTab === "news" && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: colors.gold }}
            />
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Chart Area (passed as children) */}
          {children ? (
            children
          ) : (
            <div
              className="h-[350px] rounded-[10px] flex items-center justify-center"
              style={{
                backgroundColor: colors.box,
                border: `1px solid ${colors.boxOutline}`,
              }}
            >
              <span style={{ color: colors.textSecondary }}>
                Chart coming soon
              </span>
            </div>
          )}

          {/* Buy/Sell Spread */}
          {buySellData && (
            <div className="space-y-2">
              <h3
                className="font-mono text-sm font-medium px-1"
                style={{ color: colors.textPrimary }}
              >
                Market Pressure
              </h3>
              <BuySellSpread
                buyPercentage={buySellData.buyPercentage}
                sellPercentage={buySellData.sellPercentage}
                buyVolume={buySellData.buyVolume}
                sellVolume={buySellData.sellVolume}
                buyOrders={buySellData.buyOrders}
                sellOrders={buySellData.sellOrders}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === "news" && (
        <div
          className="p-8 rounded-[10px] text-center"
          style={{
            backgroundColor: colors.box,
            border: `1px solid ${colors.boxOutline}`,
          }}
        >
          <span style={{ color: colors.textSecondary }}>
            News feed coming soon
          </span>
        </div>
      )}
    </main>
  );
};
