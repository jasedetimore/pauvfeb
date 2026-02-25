"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { colors } from "@/lib/constants/colors";
import {
  IssuerHeaderSkeleton,
  ChartSkeleton,
  PriceDisplay,
} from "@/components/atoms";

import {
  TradingLeftSidebar,
  TradingMainContent,
  TradingRightSidebar,
  PriceChart,
} from "@/components/organisms";
import {
  TradingFormSimple,
  TradingSummarySection,
  UserHoldings,
  RecommendedIssuers,
  HoldersSection,
  IssuerHeader,
} from "@/components/molecules";
import { createBrowserClient } from "@supabase/ssr";
import { IssuerDetailsDB } from "@/lib/types/issuer";
import { IssuerLinksDB } from "@/lib/types/issuer-links";
import { useIssuerMetrics, useTopHolders, useIsMobile } from "@/lib/hooks";

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
  const [issuerLinks, setIssuerLinks] = useState<IssuerLinksDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMobile = useIsMobile();

  // Fetch real metrics from the API
  const { metrics, isLoading: metricsLoading, isTradable, refetch: refetchMetrics } = useIssuerMetrics(ticker);

  // Fetch real top holders data
  const { holders, isLoading: holdersLoading, refetch: refetchHolders } = useTopHolders(ticker, 10);

  // Chart refresh trigger (incremented after each order)
  const [chartRefreshTrigger, setChartRefreshTrigger] = useState(0);

  // Post-order refreshing state — drives skeleton loaders across all sections
  const [postOrderRefreshing, setPostOrderRefreshing] = useState(false);

  // Ref to hold transaction history refetch function
  const transactionRefetchRef = useRef<(() => Promise<void>) | null>(null);

  // Called when a transaction refetch function is available from UserHoldings
  const handleTransactionRefetchRef = useCallback((refetch: () => Promise<void>) => {
    transactionRefetchRef.current = refetch;
  }, []);

  // Called IMMEDIATELY when user presses confirm — triggers skeletons only.
  // We do NOT refetch here because the order hasn't been processed yet.
  // The chart keeps showing its current data (no skeleton / no stale refetch).
  const handleOrderConfirmed = useCallback(() => {
    setPostOrderRefreshing(true);
  }, []);

  // Called AFTER the "Successful" message disappears (~3s after insert).
  // By now the Supabase Edge Function should have processed the order,
  // so refetching will return fresh data.
  const handleOrderComplete = useCallback(async () => {
    // Small grace period to ensure the edge function has finished processing
    await new Promise((r) => setTimeout(r, 500));
    // Refetch all data now that the order has been processed
    await Promise.all([
      refetchMetrics(),
      refetchHolders(),
      transactionRefetchRef.current ? transactionRefetchRef.current() : Promise.resolve(),
    ]);
    // Re-trigger chart fetch now that the order is actually processed
    setChartRefreshTrigger((prev) => prev + 1);
    setPostOrderRefreshing(false);
  }, [refetchMetrics, refetchHolders]);

  // Track whether the right sidebar's children (UserHoldings, RecommendedIssuers)
  // have finished their initial fetch so we can gate the whole page on it.
  const [rightSidebarReady, setRightSidebarReady] = useState(false);
  const handleRightSidebarReady = useCallback(() => {
    setRightSidebarReady(true);
  }, []);

  // Mobile-specific: track UserHoldings loading for coordinated skeletons
  const [mobileHoldingsLoading, setMobileHoldingsLoading] = useState(true);
  const handleMobileHoldingsLoading = useCallback((loading: boolean) => {
    setMobileHoldingsLoading(loading);
  }, []);
  // Ref to hold mobile transaction history refetch function
  const mobileTransactionRefetchRef = useRef<(() => Promise<void>) | null>(null);
  const handleMobileTransactionRefetchRef = useCallback((refetch: () => Promise<void>) => {
    mobileTransactionRefetchRef.current = refetch;
  }, []);
  // Mobile: called IMMEDIATELY when user presses confirm — skeletons only
  // Chart stays visible with old data until order is fully processed.
  const handleMobileOrderConfirmed = useCallback(() => {
    setPostOrderRefreshing(true);
  }, []);

  // Mobile: called AFTER the "Successful" message disappears
  const handleMobileOrderComplete = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 500));
    await Promise.all([
      refetchMetrics(),
      refetchHolders(),
      mobileTransactionRefetchRef.current ? mobileTransactionRefetchRef.current() : Promise.resolve(),
    ]);
    // Re-trigger chart fetch now that the order is actually processed
    setChartRefreshTrigger((prev) => prev + 1);
    setPostOrderRefreshing(false);
  }, [refetchMetrics, refetchHolders]);



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

        // Fetch social links (non-blocking, optional data)
        const { data: linksData } = await supabase
          .from("issuer_links")
          .select("*")
          .eq("ticker", ticker.toUpperCase())
          .single();

        if (!isCancelled && linksData) {
          setIssuerLinks(linksData);
        }
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

  // Track mount time so we can compute seconds_on_page on unmount
  const mountTimeRef = useRef<number>(0);
  const gaPageViewFiredRef = useRef(false);
  useEffect(() => {
    mountTimeRef.current = Date.now();
    gaPageViewFiredRef.current = false;
  }, [ticker]);

  // Fire issuer_page_view once when issuer data is ready (fires once per ticker)
  // Uses GA4 custom dimensions: issuer_id, issuer_name, tag_name
  // Uses GA4 custom metrics: current_price, market_cap
  useEffect(() => {
    if (issuerData && !gaPageViewFiredRef.current) {
      gaPageViewFiredRef.current = true;
      sendGAEvent('event', 'issuer_page_view', {
        issuer_id: issuerData.ticker,
        issuer_name: issuerData.name,
        tag_name: issuerData.tag || 'none',
        current_price: metrics?.currentPrice ?? 0,
        market_cap: metrics?.marketCap ?? 0,
      });
    }
  }, [issuerData, metrics]);

  // Fire issuer_time_on_page when the user navigates away
  // Uses GA4 custom metric: seconds_on_page
  useEffect(() => {
    const capturedTicker = ticker;
    const capturedMountRef = mountTimeRef;
    return () => {
      const secondsOnPage = Math.round((Date.now() - capturedMountRef.current) / 1000);
      if (secondsOnPage > 0) {
        sendGAEvent('event', 'issuer_time_on_page', {
          issuer_id: capturedTicker,
          seconds_on_page: secondsOnPage,
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  // Handler for buy action
  const handleBuy = (amount: number) => {
    // Order is placed via the trading form component
    // Realtime subscription will auto-update the UI when processed
  };

  // Handler for sell action
  const handleSell = (amount: number) => {
    // Order is placed via the trading form component
    // Realtime subscription will auto-update the UI when processed
  };

  // Gate on template-level data being ready AND the right sidebar's children
  // having completed their initial fetch, so everything transitions together.
  // When the issuer is not tradable, we skip waiting for metrics/holders.
  const initialLoading = isTradable
    ? (isLoading || metricsLoading || holdersLoading || !rightSidebarReady)
    : (isLoading || !rightSidebarReady);

  // Show error state (only after issuer fetch itself has completed)
  if (!isLoading && (error || !issuerData)) {
    return (
      <>
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

  // Prepare issuer data for components (safe defaults when still loading)
  const issuer = issuerData
    ? {
      ticker: issuerData.ticker,
      name: issuerData.name,
      imageUrl: issuerData.photo,
      headline: issuerData.headline,
      bio: issuerData.bio,
      tags: issuerData.tag ? [issuerData.tag] : [],
    }
    : {
      ticker,
      name: "",
      imageUrl: null as string | null,
      headline: null as string | null,
      bio: null as string | null,
      tags: [] as string[],
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
      <div
        className="min-h-screen pt-4 pb-16"
        style={{ backgroundColor: colors.background }}
      >
        {/* Breadcrumb Navigation - Mobile Only */}
        {isMobile && (
          <nav className="px-4 mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm" style={{ color: colors.textSecondary }}>
              <li>
                <a href="/" className="hover:text-white transition-colors">Issuers</a>
              </li>
              {issuerData?.tag && (
                <>
                  <li><span style={{ color: colors.boxOutline }}>/</span></li>
                  <li>
                    <a href={`/?tag=${issuerData.tag.toLowerCase()}`} className="hover:text-white transition-colors capitalize">
                      {issuerData.tag}
                    </a>
                  </li>
                </>
              )}
              <li><span style={{ color: colors.boxOutline }}>/</span></li>
              <li style={{ color: colors.textPrimary }} className="font-medium" aria-current="page">
                {issuerData?.name || ticker}
              </li>
            </ol>
          </nav>
        )}

        {/* ── Mobile Layout ── */}
        <div className="lg:hidden px-4">
          {/* 1. Big heading (name, bio, links) — price is shown on the chart */}
          {initialLoading ? (
            <IssuerHeaderSkeleton />
          ) : (
            <IssuerHeader
              ticker={issuer.ticker}
              name={issuer.name}
              imageUrl={issuer.imageUrl}
              headline={issuer.headline}
              bio={issuer.bio}
              tags={issuer.tags}
              issuerLinks={issuerLinks}
              isLoading={false}
            />
          )}

          {/* 3. Chart — tight gap from social links */}
          <div className="mt-1">
            {initialLoading && (metricsLoading || isTradable) ? (
              <ChartSkeleton height={420} />
            ) : (
              <PriceChart ticker={ticker} height={420} initialRange="7d" refreshTrigger={chartRefreshTrigger} isTradable={isTradable} />
            )}
          </div>

          {/* 4. Place order */}
          <div className="mt-4">
            <TradingFormSimple
              ticker={ticker}
              price={currentPrice}
              priceStep={priceStep}
              onBuy={handleBuy}
              onSell={handleSell}
              onOrderConfirmed={handleMobileOrderConfirmed}
              onOrderComplete={handleMobileOrderComplete}
              isLoading={initialLoading || mobileHoldingsLoading}
              disabled={!currentPrice || !isTradable}
              isTradable={isTradable}
              hideTitle={true}
            />
          </div>

          {/* 5. Trading summary */}
          <div className="mt-4">
            <TradingSummarySection
              data={initialLoading ? null : tradingData}
              isLoading={initialLoading || postOrderRefreshing}
              isTradable={isTradable}
              onRefresh={refetchMetrics}
            />
          </div>

          {/* 6. Transaction history */}
          <div className="mt-4">
            <UserHoldings
              ticker={ticker}
              onRefetchRef={handleMobileTransactionRefetchRef}
              forceSkeleton={initialLoading || mobileHoldingsLoading || postOrderRefreshing}
              onLoadingChange={handleMobileHoldingsLoading}
            />
          </div>

          {/* 7. Recommended */}
          <div className="mt-4">
            <RecommendedIssuers
              currentTicker={ticker}
              currentTag={issuerData?.tag}
              forceSkeleton={initialLoading}
            />
          </div>

          {/* 8. Top holders */}
          <div className="mt-4">
            <HoldersSection
              holders={initialLoading ? [] : holders}
              isLoading={initialLoading || postOrderRefreshing}
              onRefresh={refetchHolders}
            />
          </div>
        </div>

        {/* ── Desktop Layout ── 3-column with sidebars */}
        <div className="hidden lg:flex gap-6 px-4">
          {/* Left Sidebar - Pinned to left */}
          <aside className="w-80 flex-shrink-0">
            <TradingLeftSidebar
              ticker={ticker}
              price={initialLoading ? null : currentPrice}
              tradingData={initialLoading ? null : tradingData}
              isLoading={initialLoading}
              isTradable={isTradable}
              onRefreshMetrics={refetchMetrics}
              issuerTag={issuerData?.tag}
              postOrderRefreshing={postOrderRefreshing}
            />
          </aside>

          {/* Main Content - Center, flexible width */}
          <div className="flex-1 min-w-0">
            {initialLoading ? (
              <>
                <IssuerHeaderSkeleton />
                <div className="mt-4">
                  {(metricsLoading || isTradable) ? (
                    <ChartSkeleton height={420} />
                  ) : (
                    <PriceChart ticker={ticker} height={420} initialRange="7d" refreshTrigger={chartRefreshTrigger} isTradable={isTradable} />
                  )}
                </div>
              </>
            ) : (
              <TradingMainContent
                issuer={issuer}
                issuerLinks={issuerLinks}
                isLoading={false}
              >
                <PriceChart ticker={ticker} height={420} initialRange="7d" refreshTrigger={chartRefreshTrigger} isTradable={isTradable} />
              </TradingMainContent>
            )}
          </div>

          {/* Right Sidebar - Pinned to right */}
          <aside className="w-80 flex-shrink-0 pb-8">
            <TradingRightSidebar
              ticker={ticker}
              price={currentPrice}
              priceStep={priceStep}
              isLoading={initialLoading}
              isTradable={isTradable}
              onBuy={handleBuy}
              onSell={handleSell}
              onOrderConfirmed={handleOrderConfirmed}
              onOrderComplete={handleOrderComplete}
              onTransactionRefetchRef={handleTransactionRefetchRef}
              holders={initialLoading ? [] : holders}
              onRefreshHolders={refetchHolders}
              onReady={handleRightSidebarReady}
              postOrderRefreshing={postOrderRefreshing}
            />
          </aside>
        </div>
      </div>
    </>
  );
};
