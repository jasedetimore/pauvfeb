"use client";

import React, { useState, useEffect } from "react";
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
import { useIssuerMetrics, useTopHolders } from "@/lib/hooks";

interface IssuerTradingTemplateProps {
  ticker: string;
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
  
  // Fetch real top holders data
  const { holders, isLoading: holdersLoading, refetch: refetchHolders } = useTopHolders(ticker, 10);

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

  // Handler for buy action
  const handleBuy = (amount: number) => {
    console.log(`Buying ${amount} of ${ticker}`);
    // Order is placed via the trading form component
    // Realtime subscription will auto-update the UI when processed
  };

  // Handler for sell action
  const handleSell = (amount: number) => {
    console.log(`Selling ${amount} of ${ticker}`);
    // Order is placed via the trading form component
    // Realtime subscription will auto-update the UI when processed
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
  const priceStep = metrics?.priceStep ?? 0.01;

  return (
    <>
      <AuthHeader />
      <div
        className="min-h-screen pb-16"
        style={{ backgroundColor: colors.background }}
      >
        {/* Fluid Layout - Sidebars pinned to sides, whole page scrolls together */}
        <div className="flex gap-4 px-4">
          {/* Left Sidebar - Pinned to left */}
          <aside className="hidden lg:block lg:w-80 lg:flex-shrink-0">
            <TradingLeftSidebar
              ticker={ticker}
              price={currentPrice}
              tradingData={tradingData}
              holders={holders}
              twitterUrl={null}
              instagramUrl={null}
              tiktokUrl={null}
              isLoading={metricsLoading || holdersLoading}
              onRefreshMetrics={refetchMetrics}
              onRefreshHolders={refetchHolders}
            />
          </aside>

          {/* Main Content - Center, flexible width */}
          <div className="flex-1 min-w-0">
            {/* Mobile left sidebar */}
            <div className="lg:hidden mb-6">
              <TradingLeftSidebar
                ticker={ticker}
                price={currentPrice}
                tradingData={tradingData}
                holders={holders}
                twitterUrl={null}
                instagramUrl={null}
                tiktokUrl={null}
                isLoading={metricsLoading || holdersLoading}
                onRefreshMetrics={refetchMetrics}
                onRefreshHolders={refetchHolders}
              />
            </div>

            <TradingMainContent
              issuer={issuer}
              isLoading={false}
            >
              <PriceChart ticker={ticker} height={350} initialRange="24h" />
            </TradingMainContent>

            {/* Mobile right sidebar */}
            <div className="lg:hidden mt-6">
              <TradingRightSidebar
                ticker={ticker}
                price={currentPrice}
                priceStep={priceStep}
                isLoading={metricsLoading}
                onBuy={handleBuy}
                onSell={handleSell}
              />
            </div>
          </div>

          {/* Right Sidebar - Pinned to right */}
          <aside className="hidden lg:block lg:w-80 lg:flex-shrink-0">
            <TradingRightSidebar
              ticker={ticker}
              price={currentPrice}
              priceStep={priceStep}
              isLoading={metricsLoading}
              onBuy={handleBuy}
              onSell={handleSell}
            />
          </aside>
        </div>
      </div>
    </>
  );
};
