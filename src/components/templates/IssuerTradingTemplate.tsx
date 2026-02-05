"use client";

import React, { useState, useEffect, useMemo } from "react";
import { colors } from "@/lib/constants/colors";
import { FullPageSkeleton } from "@/components/atoms";
import { AuthHeader } from "@/components/molecules";
import {
  TradingLeftSidebar,
  TradingMainContent,
  TradingRightSidebar,
  PriceChart,
} from "@/components/organisms";
import { createBrowserClient } from "@supabase/ssr";
import { IssuerDetailsDB } from "@/lib/types/issuer";
import { useIssuerMetrics } from "@/lib/hooks";

interface IssuerTradingTemplateProps {
  ticker: string;
}

/**
 * Generate mock holders data (until we have real holder fetching)
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
  
  // Fetch real metrics from the API
  const { metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useIssuerMetrics(ticker);

  // Fetch issuer data from Supabase
  useEffect(() => {
    let isCancelled = false;
    
    const fetchIssuer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create a local client that ignores the user's session.
        // This prevents any "waiting for session restore" delays when logged in,
        // ensuring the public data loads immediately regardless of auth state.
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
            },
          }
        );
        
        const { data, error: fetchError } = await supabase
          .from("issuer_details")
          .select("*")
          .eq("ticker", ticker.toUpperCase())
          .single();

        if (isCancelled) {
          return;
        }

        if (fetchError) {
          if (fetchError.code === "PGRST116") {
            setError("Issuer not found");
          } else {
            setError(`Failed to load issuer data: ${fetchError.message}`);
          }
          console.error("[IssuerTradingTemplate] Supabase error:", fetchError);
          return;
        }

        if (!data) {
          setError("No data returned from database");
          return;
        }

        setIssuerData(data);
      } catch (err) {
        if (!isCancelled) {
          console.error("[IssuerTradingTemplate] Error fetching issuer:", err);
          const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
          setError(errorMessage.includes("aborted") ? "Request timeout - please try again" : errorMessage);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    if (ticker) {
      fetchIssuer();
    } else {
      setIsLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [ticker]);

  // Generate mock holders (temporary until we have real holder data)
  const holders = useMemo(() => {
    return generateMockHolders(10);
  }, []);

  // Derive buy/sell data from metrics
  const buySellData = useMemo(() => {
    // Generate mock buy/sell ratios for now
    const buyPercentage = 55;
    const sellPercentage = 45;
    const volume = metrics?.volume24h || 0;
    return {
      buyPercentage,
      sellPercentage,
      buyVolume: Math.floor(volume * 0.55),
      sellVolume: Math.floor(volume * 0.45),
      buyOrders: Math.floor(Math.random() * 500),
      sellOrders: Math.floor(Math.random() * 400),
    };
  }, [metrics]);

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

  // Use real metrics data from the API
  const tradingData = {
    volume24h: metrics?.volume24h ?? null,
    circulatingSupply: metrics?.circulatingSupply ?? null,
    holders: metrics?.holders ?? null,
    marketCap: metrics?.marketCap ?? null,
    price1hChange: metrics?.price1hChange ?? null,
    price24hChange: metrics?.price24hChange ?? null,
    price7dChange: metrics?.price7dChange ?? null,
  };

  // Get current price from metrics
  const currentPrice = metrics?.currentPrice ?? 0;

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
                price={currentPrice}
                tradingData={tradingData}
                holders={holders}
                twitterUrl={null}
                instagramUrl={null}
                tiktokUrl={null}
                isLoading={metricsLoading}
                onRefreshMetrics={refetchMetrics}
                onRefreshHolders={() => console.log("Refresh holders")}
              />
            </div>

            {/* Main Content - Header, Chart, Tags */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <TradingMainContent
                issuer={issuer}
                buySellData={buySellData}
                isLoading={false}
              >
                <PriceChart ticker={ticker} height={350} initialRange="24h" />
              </TradingMainContent>
            </div>

            {/* Right Sidebar - Trading Form */}
            <div className="lg:col-span-3 order-3">
              <TradingRightSidebar
                ticker={ticker}
                price={currentPrice}
                isLoading={metricsLoading}
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
