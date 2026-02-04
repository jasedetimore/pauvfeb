"use client";

import React, { useMemo } from "react";
import { CG, CR } from "@/constants/colors";
import { OrderStatisticsResponse } from "@/types/market";

interface SpreadItem {
  current_price: string | number;
  price_24h_change: string | number;
  total_value_usdp: string | number;
  primary_tag?: string | null;
  // New fields for order statistics
  type?: "buy" | "sell";
  percentage?: number;
  volume?: number;
  orders?: number;
}

interface BuySellSpreadProps {
  items: SpreadItem[];
  selectedTag?: string | null;
  className?: string;
  globalOrderStats?: OrderStatisticsResponse | null;
  globalOrderStatsLoading?: boolean;
}

interface SpreadData {
  buyPct: number;
  sellPct: number;
  totalBuyScore: number;
  totalSellScore: number;
  totalScore: number;
  issuerCount: number;
  hasData: boolean;
  isOrderStats: boolean;
  buyOrders?: number;
  sellOrders?: number;
}

export function BuySellSpread({
  items,
  selectedTag,
  className,
  globalOrderStats,
  globalOrderStatsLoading,
}: BuySellSpreadProps) {
  const spreadData: SpreadData = useMemo(() => {
    if (!selectedTag && globalOrderStats && !globalOrderStatsLoading) {
      const result: SpreadData = {
        buyPct: globalOrderStats.buy_pressure_percent / 100,
        sellPct: globalOrderStats.sell_pressure_percent / 100,
        totalBuyScore: globalOrderStats.buy_volume,
        totalSellScore: globalOrderStats.sell_volume,
        totalScore: globalOrderStats.total_volume,
        buyOrders: globalOrderStats.buy_orders,
        sellOrders: globalOrderStats.sell_orders,
        issuerCount: globalOrderStats.total_orders,
        hasData: globalOrderStats.total_orders > 0,
        isOrderStats: true,
      };
      return result;
    }

    // Filter items by tag if selected (item-based calculation)
    const relevantItems = selectedTag
      ? Array.isArray(items)
        ? items.filter((item) => item.primary_tag === selectedTag)
        : []
      : Array.isArray(items)
        ? items
        : [];

    // Check if we have order statistics data (new format)
    const hasOrderStats = relevantItems.some(
      (item) => item.type && item.percentage !== undefined
    );

    if (hasOrderStats) {
      const buyItem = relevantItems.find((item) => item.type === "buy");
      const sellItem = relevantItems.find((item) => item.type === "sell");

      const buyPct = (buyItem?.percentage || 0) / 100;
      const sellPct = (sellItem?.percentage || 0) / 100;
      const totalBuyVolume = buyItem?.volume || 0;
      const totalSellVolume = sellItem?.volume || 0;

      return {
        buyPct,
        sellPct,
        totalBuyScore: totalBuyVolume,
        totalSellScore: totalSellVolume,
        totalScore: totalBuyVolume + totalSellVolume,
        buyOrders: buyItem?.orders || 0,
        sellOrders: sellItem?.orders || 0,
        issuerCount: relevantItems.length,
        hasData: buyPct + sellPct > 0,
        isOrderStats: true,
      };
    }

    let totalBuyScore = 0;
    let totalSellScore = 0;

    relevantItems.forEach((item) => {
      const currentPrice = parseFloat(String(item.current_price)) || 0;
      const priceChange24h = parseFloat(String(item.price_24h_change)) || 0;
      const marketCap = parseFloat(String(item.total_value_usdp)) || 0;

      if (currentPrice > 0 && marketCap > 0) {
        const pressure = marketCap * Math.abs(priceChange24h / 100);

        if (priceChange24h > 0) {
          totalBuyScore += pressure;
        } else if (priceChange24h < 0) {
          totalSellScore += pressure;
        }
      }
    });

    const totalScore = totalBuyScore + totalSellScore;
    const buyPct = totalScore > 0 ? totalBuyScore / totalScore : 0.5;
    const sellPct = 1 - buyPct;

    return {
      buyPct,
      sellPct,
      totalBuyScore,
      totalSellScore,
      totalScore,
      issuerCount: relevantItems.length,
      hasData: totalScore > 0,
      isOrderStats: false,
    };
  }, [items, selectedTag, globalOrderStats, globalOrderStatsLoading]);

  const buyWidth = spreadData.hasData
    ? Math.max(spreadData.buyPct * 100, 1)
    : 50;
  const sellWidth = spreadData.hasData
    ? Math.max(spreadData.sellPct * 100, 1)
    : 50;

  return (
    <>
      <section
        className={`bg-neutral-900  rounded-lg mt-0 p-4 hover:bg-neutral-800 ${className}`}
      >
        <div className="relative">
        <div className="flex h-2 rounded-lg overflow-hidden bg-neutral-700">
          {spreadData.hasData ? (
            <>
              <div
                className="flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${buyWidth}%`, backgroundColor: CG }}
              />
              <div
                className="flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${sellWidth}%`, backgroundColor: CR }}
              />
            </>
          ) : (
            <div
              className="flex items-center justify-center text-neutral-400 text-xs font-medium w-full"
              style={{ backgroundColor: "#9CA3AF" }}
            >
              No price movement data
            </div>
          )}
        </div>
        {spreadData.hasData ? (
          <div className="space-y-1 mt-1">
            <div className="flex justify-between text-xs">
              <div
                style={{ color: CG }}
              >{`${(spreadData.buyPct * 100).toFixed(1)}% Buy`}</div>
              <div style={{ color: CR }} className="text-right">
                {`${(spreadData.sellPct * 100).toFixed(1)}% Sell`}
              </div>
            </div>
            {spreadData.isOrderStats && (
              <div className="flex justify-between text-xs text-neutral-400">
                <div>{`${spreadData.buyOrders || 0} orders (${spreadData.totalBuyScore.toFixed(0)} vol.)`}</div>
                <div className="text-right">{`${spreadData.sellOrders || 0} orders (${spreadData.totalSellScore.toFixed(0)} vol.)`}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center  mt-3 text-[11.8px] text-neutral-400">
            {spreadData.isOrderStats
              ? "No orders yet..."
              : "Waiting for 24h price movement data..."}
          </div>
        )}
      </div>
    </section>
    </>
  );
}
