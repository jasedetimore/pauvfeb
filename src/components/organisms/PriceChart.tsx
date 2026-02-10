"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  LineStyle,
  Time,
  IChartApi,
  ISeriesApi,
  LineData,
  LineSeries,
} from "lightweight-charts";
import { colors } from "@/lib/constants/colors";
import { createBrowserClient } from "@supabase/ssr";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface OHLCDataPoint {
  bucket: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  avg_price: number;
}

export interface PriceChartProps {
  ticker: string;
  height?: number;
  initialRange?: string;
  refreshTrigger?: number;
  /** When false the issuer has no issuer_trading row yet */
  isTradable?: boolean;
}

const RANGE_OPTIONS = [
  { label: "1h", value: "1h", interval: "1 minute", duration: "1 hour" },
  { label: "24h", value: "24h", interval: "5 minutes", duration: "24 hours" },
  { label: "7d", value: "7d", interval: "1 hour", duration: "7 days" },
  { label: "30d", value: "30d", interval: "4 hours", duration: "30 days" },
  { label: "All", value: "all", interval: "1 day", duration: "365 days" },
];

/**
 * PriceChart - Displays historical price data using lightweight-charts
 * Fetches OHLC data from Supabase price_history via the get_ohlc_data function
 */
export const PriceChart: React.FC<PriceChartProps> = ({
  ticker,
  height = 350,
  initialRange = "24h",
  refreshTrigger,
  isTradable = true,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const firstPriceRef = useRef<number | null>(null);
  const hasFetchedRef = useRef(false);

  const [chartData, setChartData] = useState<LineData<Time>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState(initialRange);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<{
    change: number;
    percent: number;
  } | null>(null);

  // Create Supabase client without session persistence for public data
  const getSupabaseClient = useCallback(() => {
    return createBrowserClient(
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
  }, []);

  // Fetch OHLC data from Supabase
  const fetchChartData = useCallback(
    async (range: string) => {
      // Only show loading on initial fetch, not on silent refetches
      if (!hasFetchedRef.current) {
        setLoading(true);
      }
      setError(null);

      try {
        const supabase = getSupabaseClient();
        const rangeConfig = RANGE_OPTIONS.find((r) => r.value === range);

        if (!rangeConfig) {
          throw new Error("Invalid range selected");
        }

        // Call the get_ohlc_data function
        const { data, error: fetchError } = await supabase.rpc("get_ohlc_data", {
          p_ticker: ticker.toUpperCase(),
          p_interval: rangeConfig.interval,
          p_start_time: new Date(
            Date.now() - parseDuration(rangeConfig.duration)
          ).toISOString(),
          p_end_time: new Date().toISOString(),
        });

        if (fetchError) {
          console.error("[PriceChart] Error fetching OHLC data:", fetchError);
          throw new Error(fetchError.message);
        }

        if (!data || data.length === 0) {
          // No historical data yet - show empty state
          setChartData([]);
          setCurrentPrice(null);
          setPriceChange(null);
          return;
        }

        // Transform data for lightweight-charts (using close price for line chart)
        const formattedData: LineData<Time>[] = data.map(
          (point: OHLCDataPoint) => ({
            time: Math.floor(new Date(point.bucket).getTime() / 1000) as Time,
            value: Number(point.close),
          })
        );

        // Sort by time ascending
        formattedData.sort((a, b) => (a.time as number) - (b.time as number));

        setChartData(formattedData);

        // Set current price from latest data point
        if (formattedData.length > 0) {
          const latestPrice = formattedData[formattedData.length - 1].value;
          const firstPrice = formattedData[0].value;
          setCurrentPrice(latestPrice);
          firstPriceRef.current = firstPrice; // Store for realtime updates

          if (firstPrice > 0) {
            const change = latestPrice - firstPrice;
            const percent = ((change / firstPrice) * 100);
            setPriceChange({ change, percent });
          }
        }
        hasFetchedRef.current = true;
      } catch (err) {
        console.error("[PriceChart] Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load chart data");
      } finally {
        setLoading(false);
      }
    },
    [ticker, getSupabaseClient]
  );

  // Parse duration string to milliseconds
  function parseDuration(duration: string): number {
    const match = duration.match(/(\d+)\s*(minute|hour|day|week|month|year)s?/);
    if (!match) return 24 * 60 * 60 * 1000; // Default 24 hours

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case "minute":
        return value * 60 * 1000;
      case "hour":
        return value * 60 * 60 * 1000;
      case "day":
        return value * 24 * 60 * 60 * 1000;
      case "week":
        return value * 7 * 24 * 60 * 60 * 1000;
      case "month":
        return value * 30 * 24 * 60 * 60 * 1000;
      case "year":
        return value * 365 * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#000000" },
        textColor: colors.textSecondary,
      },
      grid: {
        vertLines: { color: "#2a2a2a", style: LineStyle.Dotted },
        horzLines: { color: "#2a2a2a", style: LineStyle.Dotted },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      rightPriceScale: {
        borderColor: colors.boxOutline,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: colors.boxOutline,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          color: "#555555",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#333333",
        },
        horzLine: {
          color: "#555555",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#333333",
        },
      },
    });

    // Create line series (color will be updated dynamically based on price direction)
    const lineSeries = chart.addSeries(LineSeries, {
      color: colors.green,
      lineWidth: 2,
      priceFormat: {
        type: "price",
        precision: 6,
        minMove: 0.000001,
      },
    });

    chartRef.current = chart;
    lineSeriesRef.current = lineSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      lineSeriesRef.current = null;
    };
  }, [height]);

  // Update chart data and line color when data changes
  useEffect(() => {
    if (lineSeriesRef.current && chartData.length > 0) {
      lineSeriesRef.current.setData(chartData);
      chartRef.current?.timeScale().fitContent();

      // Set line color based on price direction
      const firstVal = chartData[0].value;
      const lastVal = chartData[chartData.length - 1].value;
      const isUp = lastVal >= firstVal;
      lineSeriesRef.current.applyOptions({
        color: isUp ? colors.green : colors.red,
      });
    }
  }, [chartData]);

  // Fetch data when range changes
  useEffect(() => {
    fetchChartData(selectedRange);
  }, [selectedRange, fetchChartData]);

  // Refetch when refreshTrigger changes (after an order)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchChartData(selectedRange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Subscribe to Realtime updates to refresh chart when trades happen
  useEffect(() => {
    if (!ticker) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Subscribe to changes on issuer_trading table for this ticker
    const channel = supabase
      .channel(`price-chart-${ticker.toUpperCase()}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "issuer_trading",
          filter: `ticker=eq.${ticker.toUpperCase()}`,
        },
        (payload) => {
          
          // Immediately update the chart with the new price point
          const newPrice = payload.new?.current_price;
          if (newPrice && lineSeriesRef.current) {
            const now = Math.floor(Date.now() / 1000) as Time;
            const priceValue = Number(newPrice);
            
            // Update the current price display immediately
            setCurrentPrice(priceValue);
            
            // Add the new data point to the chart
            lineSeriesRef.current.update({
              time: now,
              value: priceValue,
            });
            
            // Update price change using stored first price
            const firstPrice = firstPriceRef.current;
            if (firstPrice && firstPrice > 0) {
              const change = priceValue - firstPrice;
              const percent = (change / firstPrice) * 100;
              setPriceChange({ change, percent });
            }
          }
          
          // Also refetch full data to ensure consistency (debounced)
          fetchChartData(selectedRange);
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [ticker, selectedRange, fetchChartData]);

  // Handle range change - show loading when switching ranges
  const handleRangeChange = (range: string) => {
    hasFetchedRef.current = false;
    setSelectedRange(range);
  };

  // If issuer is not tradable, show a big "Launching soon..." placeholder with email signup
  const [launchEmail, setLaunchEmail] = React.useState("");
  const [emailSubmitted, setEmailSubmitted] = React.useState(false);

  const handleEmailSubmit = async () => {
    if (!launchEmail || !launchEmail.includes("@")) return;
    try {
      const res = await fetch("/api/launch-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: launchEmail, ticker }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("[PriceChart] Email signup failed:", data.error);
        return;
      }
      setEmailSubmitted(true);
    } catch (err) {
      console.error("[PriceChart] Email signup error:", err);
    }
  };

  if (!isTradable) {
    return (
      <div
        className="rounded-[10px] overflow-hidden"
        style={{ backgroundColor: "#000000" }}
      >
        <div
          className="flex flex-col items-center justify-start gap-4 pt-16"
          style={{ height }}
        >
          <span
            className="font-mono text-2xl font-bold"
            style={{ color: colors.textPrimary }}
          >
            Launching soon...
          </span>

          {emailSubmitted ? (
            <p className="font-mono text-sm" style={{ color: colors.green }}>
              You&apos;ll be notified when ${ticker.toUpperCase()} launches!
            </p>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full max-w-sm px-4">
              <p className="font-mono text-base" style={{ color: colors.textSecondary }}>
                Get notified when trading goes live
              </p>
              <div className="flex w-full gap-2">
                <input
                  type="email"
                  value={launchEmail}
                  onChange={(e) => setLaunchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                  placeholder="Your email"
                  className="flex-1 min-w-0 px-3 py-2 rounded-md font-mono text-sm focus:outline-none"
                  style={{
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.boxOutline}`,
                    color: colors.textPrimary,
                  }}
                />
                <button
                  onClick={handleEmailSubmit}
                  className="px-4 py-2 rounded-md font-mono text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0"
                  style={{
                    backgroundColor: colors.gold,
                    cursor: "pointer",
                    color: colors.textDark,
                  }}
                >
                  Notify Me
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{
        backgroundColor: "#000000",
      }}
    >
      {/* Header with price info and range selector */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: colors.boxOutline }}
      >
        <div className="flex items-center gap-4 lg:hidden">
          {currentPrice !== null && (
            <div className="flex flex-col">
              <span
                className="font-mono text-[2.8rem] leading-tight font-bold"
                style={{ color: colors.textPrimary }}
              >
                ${currentPrice.toFixed(6)}
              </span>
              {priceChange && (
                <span
                  className="font-mono text-xl"
                  style={{
                    color: priceChange.percent >= 0 ? colors.green : colors.red,
                  }}
                >
                  {priceChange.percent >= 0 ? "+" : ""}
                  {priceChange.percent.toFixed(2)}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Range Selector */}
        <div className="flex gap-1 ml-auto">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleRangeChange(option.value)}
              className="px-3 py-1 rounded font-mono text-xs transition-colors"
              style={{
                backgroundColor:
                  selectedRange === option.value
                    ? colors.green
                    : "transparent",
                color:
                  selectedRange === option.value
                    ? colors.textDark
                    : colors.textSecondary,
                border: `1px solid ${
                  selectedRange === option.value
                    ? colors.green
                    : colors.boxOutline
                }`,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative" style={{ height, maxWidth: "100%" }}>
        {loading && (
          <div
            className="absolute inset-0 z-10"
            style={{ backgroundColor: "#000000" }}
          >
            {/* Subtle shimmer lines hinting at chart grid */}
            <div className="absolute inset-0 flex flex-col justify-between py-6 px-4 opacity-20 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{ height: "1px", backgroundColor: colors.boxOutline }}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10"
            style={{ backgroundColor: "#000000" }}
          >
            <div className="text-center">
              <span
                className="font-mono text-sm block"
                style={{ color: colors.red }}
              >
                {error}
              </span>
              <button
                onClick={() => fetchChartData(selectedRange)}
                className="mt-2 px-4 py-1 rounded font-mono text-xs"
                style={{
                  backgroundColor: colors.green,
                  color: colors.textDark,
                }}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && chartData.length === 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10"
            style={{ backgroundColor: "#000000" }}
          >
            <div className="text-center">
              <span
                className="font-mono text-sm"
                style={{ color: colors.textSecondary }}
              >
                No price history available yet
              </span>
              <p
                className="font-mono text-xs mt-1"
                style={{ color: colors.textMuted }}
              >
                Price data will appear after trading begins
              </p>
            </div>
          </div>
        )}

        <div ref={chartContainerRef} style={{ height: "100%", width: "100%" }} />
      </div>
    </div>
  );
};
