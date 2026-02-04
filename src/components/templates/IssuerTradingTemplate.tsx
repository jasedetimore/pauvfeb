"use client";

import React, { useState, useEffect, useMemo } from "react";
import { colors } from "@/lib/constants/colors";
import { FullPageSkeleton } from "@/components/atoms";
import { AuthHeader } from "@/components/molecules";
import {
  TradingLeftSidebar,
  TradingMainContent,
  TradingRightSidebar,
} from "@/components/organisms";
import { createClient } from "@/lib/supabase/client";
import { IssuerDetailsDB } from "@/lib/types/issuer";

interface IssuerTradingTemplateProps {
  ticker: string;
}

/**
 * Generate mock market data for an issuer (temporary until real data)
 */
function generateMockMarketData(ticker: string) {
  const seed = ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number) => {
    const x = Math.sin(seed) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };

  return {
    currentPrice: random(0.00001, 0.01),
    price1hChange: random(-5, 5),
    price24hChange: random(-15, 15),
    price7dChange: random(-25, 25),
    volume24h: Math.floor(random(10000, 500000)),
    circulatingSupply: Math.floor(random(1000000, 50000000)),
    holders: Math.floor(random(100, 5000)),
    marketCap: Math.floor(random(50000, 2000000)),
    buyPercentage: random(30, 70),
    sellPercentage: random(30, 70),
  };
}

/**
 * Generate mock holders data
 */
function generateMockHolders(count: number = 10) {
  const usernames = [
    "whale_trader",
    "crypto_king",
    "diamond_hands",
    "moon_shot",
    "hodl_master",
    "early_adopter",
    "degen_investor",
    "alpha_seeker",
    "market_maker",
    "smart_money",
  ];

  return usernames.slice(0, count).map((username, i) => ({
    username,
    quantity: Math.floor(Math.random() * 100000) / (i + 1),
    supplyPercentage: Math.random() * 15 / (i + 1),
  }));
}

/**
 * IssuerTradingTemplate - Full page template for issuer trading
 * Combines left sidebar, main content, and right sidebar
 */
export const IssuerTradingTemplate: React.FC<IssuerTradingTemplateProps> = ({
  ticker,
}) => {
  const [issuerData, setIssuerData] = useState<IssuerDetailsDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch issuer data from Supabase
  useEffect(() => {
    const fetchIssuer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from("issuer_details")
          .select("*")
          .eq("ticker", ticker.toUpperCase())
          .single();

        if (fetchError) {
          if (fetchError.code === "PGRST116") {
            setError("Issuer not found");
          } else {
            setError("Failed to load issuer data");
          }
          console.error("Supabase error:", fetchError);
          return;
        }

        setIssuerData(data);
      } catch (err) {
        console.error("Error fetching issuer:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (ticker) {
      fetchIssuer();
    }
  }, [ticker]);

  // Generate mock market data
  const marketData = useMemo(() => {
    return generateMockMarketData(ticker);
  }, [ticker]);

  // Generate mock holders
  const holders = useMemo(() => {
    return generateMockHolders(10);
  }, []);

  // Normalize buy/sell percentages
  const buySellData = useMemo(() => {
    const total = marketData.buyPercentage + marketData.sellPercentage;
    return {
      buyPercentage: (marketData.buyPercentage / total) * 100,
      sellPercentage: (marketData.sellPercentage / total) * 100,
      buyVolume: Math.floor(marketData.volume24h * 0.55),
      sellVolume: Math.floor(marketData.volume24h * 0.45),
      buyOrders: Math.floor(Math.random() * 500),
      sellOrders: Math.floor(Math.random() * 400),
    };
  }, [marketData]);

  // Handler for buy action
  const handleBuy = (amount: number) => {
    console.log(`Buying ${amount} of ${ticker}`);
    // TODO: Implement actual buy logic
    alert(`Buy order placed for ${amount} ${ticker.toUpperCase()}`);
  };

  // Handler for sell action
  const handleSell = (amount: number) => {
    console.log(`Selling ${amount} of ${ticker}`);
    // TODO: Implement actual sell logic
    alert(`Sell order placed for ${amount} ${ticker.toUpperCase()}`);
  };

  // Show loading skeleton
  if (isLoading) {
    return (
      <>
        <AuthHeader />
        <FullPageSkeleton />
      </>
    );
  }

  // Show error state
  if (error || !issuerData) {
    return (
      <>
        <AuthHeader />
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: colors.background }}
        >
          <div className="text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${colors.red}20` }}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke={colors.red}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1
              className="text-xl font-bold font-mono mb-2"
              style={{ color: colors.textPrimary }}
            >
              {error || "Issuer Not Found"}
            </h1>
            <p
              className="font-mono"
              style={{ color: colors.textSecondary }}
            >
              The issuer &quot;{ticker}&quot; could not be found.
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-6 px-6 py-2 rounded-md font-mono transition-colors"
              style={{
                backgroundColor: colors.gold,
                color: colors.textDark,
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  // Prepare issuer data for components
  const issuer = {
    ticker: issuerData.ticker,
    name: issuerData.name,
    imageUrl: issuerData.photo,
    headline: issuerData.headline,
    bio: issuerData.bio,
    tags: issuerData.tag ? [issuerData.tag] : [],
  };

  const tradingData = {
    volume24h: marketData.volume24h,
    circulatingSupply: marketData.circulatingSupply,
    holders: marketData.holders,
    marketCap: marketData.marketCap,
    price1hChange: marketData.price1hChange,
    price24hChange: marketData.price24hChange,
    price7dChange: marketData.price7dChange,
  };

  return (
    <>
      <AuthHeader />
      <div
        className="min-h-screen pt-4 pb-16"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-7xl mx-auto px-4">
          {/* Three column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Price, Summary, Holders */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <TradingLeftSidebar
                ticker={ticker}
                price={marketData.currentPrice}
                tradingData={tradingData}
                holders={holders}
                twitterUrl={null}
                instagramUrl={null}
                tiktokUrl={null}
                isLoading={false}
                onRefreshMetrics={() => console.log("Refresh metrics")}
                onRefreshHolders={() => console.log("Refresh holders")}
              />
            </div>

            {/* Main Content - Header, Chart, Tags */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <TradingMainContent
                issuer={issuer}
                buySellData={buySellData}
                isLoading={false}
              />
            </div>

            {/* Right Sidebar - Trading Form */}
            <div className="lg:col-span-3 order-3">
              <TradingRightSidebar
                ticker={ticker}
                price={marketData.currentPrice}
                isLoading={false}
                onBuy={handleBuy}
                onSell={handleSell}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
