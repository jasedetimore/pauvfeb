"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { createChart, ColorType, LineStyle, Time, CrosshairMode } from "lightweight-charts";
import { getChartData, handleApiError } from "@/services/market-api";
import { generateFakeChartData } from "@/utils/fake-data-generator";
import { useMarketWebSocket } from "@/hooks/useMarketWebSocket";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export interface ChartDataPoint {
  t: number; // timestamp in milliseconds
  v: number; // value
}

export interface SimpleChartProps {
  height?: number;
  title?: string;
  ticker: string;
  initialRange?: string;
}



const RANGE_OPTIONS = [
  { label: "5m", value: "5m" },
  { label: "1hr", value: "1h" },
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "1y", value: "1y" },
  { label: "all", value: "all" },
];

const getTimeframeConfig = (timeframe: string) => {
  switch (timeframe) {
    case "5m":
    case "1h":
      return {
        barSpacing: 8,
        rightOffset: 3,
        timeVisible: true,
        secondsVisible: false,
      };
    case "24h":
      return {
        barSpacing: 10,
        rightOffset: 5,
        timeVisible: true,
        secondsVisible: false,
      };
    case "7d":
    case "30d":
      return {
        barSpacing: 12,
        rightOffset: 8,
        timeVisible: true,
        secondsVisible: false,
      };
    case "1y":
    case "all":
      return {
        barSpacing: 15,
        rightOffset: 10,
        timeVisible: true,
        secondsVisible: false,
      };
    default:
      return {
        barSpacing: 10,
        rightOffset: 5,
        timeVisible: true,
        secondsVisible: false,
      };
  }
};

export const LightweightChart = ({
  height = 400,
  title,
  ticker,
  initialRange = "24h",
}: SimpleChartProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const lineSeriesRef = useRef<any>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastCursorPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState(initialRange);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState(initialRange);
  const [loadingDynamic, setLoadingDynamic] = useState(false);
  const [fakeDataEnabled, setFakeDataEnabled] = useState(true);

  // Refs for state that shouldn't trigger re-renders or is needed in callbacks
  const activeTimeframeRef = useRef(initialRange);
  const loadedIntervalsRef = useRef(new Set<string>());
  const loadedDataCache = useRef(new Map<string, ChartDataPoint[]>());
  const loadedTimeRange = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const justChangedTimeframe = useRef(false);
  const previousLogicalFrom = useRef<number | null>(null);
  const isLoadingMoreData = useRef(false);

  // Update chart configuration based on timeframe
  const updateChartConfig = (timeframe: string) => {
    if (!chartRef.current) return;

    const config = getTimeframeConfig(timeframe);
    chartRef.current.applyOptions({
      timeScale: {
        borderColor: "#27272a",
        ...config,
      },
    });
  };

  // Format data for chart
  const formatChartData = useCallback((data: ChartDataPoint[]) => {
    if (!data || data.length === 0) return [];

    const timeMap = new Map();
    data
      .filter((point) => point.t && point.v != null && !isNaN(point.v))
      .forEach((point) => {
        const time = Math.floor(point.t / 1000);
        timeMap.set(time, Number(point.v));
      });

    const sortedData = Array.from(timeMap.entries())
      .map(([time, value]) => ({ time: time as Time, value }))
      .sort((a, b) => (a.time as number) - (b.time as number));

    // Add intermediate points from last data point to current time to create a flat line
    if (sortedData.length > 0) {
      const lastPoint = sortedData[sortedData.length - 1];
      const lastTime = lastPoint.time as number;
      const currentTime = Math.floor(Date.now() / 1000);
      const lastValue = lastPoint.value;

      // Only add points if current time is after the last data point
      if (currentTime > lastTime) {
        // Add intermediate points every hour (3600 seconds) to create a smooth flat line
        const interval = 3600; // 1 hour in seconds
        
        // Start from the next interval
        let nextTime = lastTime + interval;
        
        // Add points strictly LESS than currentTime
        while (nextTime < currentTime) {
          sortedData.push({
            time: nextTime as Time,
            value: lastValue,
          });
          nextTime += interval;
        }

        // Always add a point at the current time
        sortedData.push({
          time: currentTime as Time,
          value: lastValue,
        });

        console.log(`📍 Extended line from ${new Date(lastTime * 1000).toISOString()} to ${new Date(currentTime * 1000).toISOString()}`);
      }
    }

    return sortedData;
  }, []);

  // Extract data from API/WebSocket response
  const extractChartData = (responseData: any) => {
    if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
      return responseData.data.data;
    }
    if (responseData?.data && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    if (Array.isArray(responseData)) {
      return responseData;
    }
    return [];
  };

  // Track the latest request ID to prevent race conditions
  const latestRequestIdRef = useRef<string | null>(null);

  // Load data from API and cache it
  const loadData = async (range: string, tickerSymbol: string, isInitial: boolean = false, isBackground: boolean = false) => {
    // Only track request ID for foreground requests
    const requestId = isBackground ? null : crypto.randomUUID();

    if (!isBackground && requestId) {
      latestRequestIdRef.current = requestId;
    }

    if (isInitial) {
      setLoading(true);
      setError(null);
      loadedIntervalsRef.current.clear();
      loadedDataCache.current.clear();
      loadedTimeRange.current = { start: 0, end: 0 };

      // Prevent auto-loading right after initial load
      justChangedTimeframe.current = true;
      previousLogicalFrom.current = null;
    }

    loadedIntervalsRef.current.add(range);

    try {
      let response;
      if (fakeDataEnabled) {
        response = generateFakeChartData(range);
      } else {
        response = await getChartData(tickerSymbol, range);
      }

      // Check if this is still the latest request (only for foreground)
      if (!isBackground && requestId && latestRequestIdRef.current !== requestId) {
        console.log(`🚫 Ignoring stale response for ${range} (req: ${requestId})`);
        return;
      }

      const chartPoints = extractChartData(response);
      console.log(`📊 Loaded ${chartPoints.length} data points for ${range}`);

      // Cache the data for this timeframe
      loadedDataCache.current.set(range, chartPoints);

      // Update loaded time range
      if (chartPoints.length > 0) {
        loadedTimeRange.current = {
          start: chartPoints[0].t,
          end: chartPoints[chartPoints.length - 1].t,
        };
      }

      // If this is the currently selected range, display it
      // We double check against selectedRange state, but the requestId check is the primary guard
      if (!isBackground) {
        setChartData(chartPoints);
        setActiveTimeframe(range); // Update active timeframe when loading data
        activeTimeframeRef.current = range; // Update ref immediately
        // Update chart config after a small delay to ensure chart is ready
        setTimeout(() => updateChartConfig(range), 100);

        // Clear the flag after 1 second to allow user-initiated zoom/pan
        if (isInitial) {
          setTimeout(() => {
            justChangedTimeframe.current = false;
          }, 1000);
        }
      }

    } catch (err: any) {
      // Check if this is still the latest request
      if (!isBackground && requestId && latestRequestIdRef.current !== requestId) {
        return;
      }

      if (!isBackground) {
        setError(handleApiError(err));
        if (isInitial) {
          setChartData([]);
        }
      }
    } finally {
      if (isInitial && !isBackground && requestId && latestRequestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  // Load more historical data when approaching the edge
  const loadMoreHistoricalData = useCallback(async () => {
    if (isLoadingMoreData.current || !loadedTimeRange.current.start) {
      return;
    }

    isLoadingMoreData.current = true;
    setLoadingDynamic(true);

    try {
      const oldestTimestamp = loadedTimeRange.current.start;
      console.log(`📥 Loading more historical data before ${new Date(oldestTimestamp).toISOString()}`);

      const response = await getChartData(ticker, activeTimeframeRef.current, {
        before: oldestTimestamp,
        limit: 500, // Load 500 more points
      });

      const newChartPoints = extractChartData(response);
      console.log(`📊 Loaded ${newChartPoints.length} more historical data points`);

      if (newChartPoints.length > 0) {
        // Prepend new data to existing data
        const combinedData = [...newChartPoints, ...chartData];
        setChartData(combinedData);

        // Update loaded time range
        loadedTimeRange.current.start = newChartPoints[0].t;

        // Update cache
        loadedDataCache.current.set(activeTimeframeRef.current, combinedData);
      }
    } catch (err: any) {
      console.error('Failed to load more historical data:', err);
    } finally {
      isLoadingMoreData.current = false;
      setLoadingDynamic(false);
    }
  }, [ticker, chartData, activeTimeframeRef]);

  // WebSocket setup
  const {
    connect,
    disconnect,
    subscribeToChart,
    unsubscribeFromChart,
    isConnected,
  } = useMarketWebSocket({
    onChartUpdate: useCallback(
      (data: any) => {
        if (fakeDataEnabled) return; // Ignore real-time updates when fake data is enabled
        
        if (data.ticker === ticker) {
          if (data.range === activeTimeframe) {
            const chartPoints = extractChartData(data);
            if (chartPoints.length > 0) {
              setChartData(chartPoints);
            }
          }
        }
      },
      [ticker, activeTimeframe, queryClient, fakeDataEnabled]
    ),
    onIssuerUpdate: useCallback(
      (data: any) => {
        if (fakeDataEnabled) return; // Ignore issuer updates when fake data is enabled for charts
        
        if (data.ticker === ticker) {
          // Update single issuer data
          if (data.data) {
            queryClient.setQueryData(["single-issuer", ticker], data.data);
          }

          // If this is an order update, refresh order statistics
          if (data.isOrderUpdate) {
            queryClient.invalidateQueries({
              queryKey: ["order-statistics", ticker],
            });
            queryClient.invalidateQueries({
              queryKey: ["issuer-holders", ticker],
            });
            queryClient.invalidateQueries({
              queryKey: ["user-wallet", user?.id],
            });
          }
        }
      },
      [ticker, queryClient]
    ),
    onError: (error) => console.error("WebSocket error:", error),
    onConnect: () => console.log("WebSocket connected"),
    onDisconnect: () => console.log("WebSocket disconnected"),
  });

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      lineSeriesRef.current = null;
    }

    // Get container width, ensuring it's calculated
    const containerWidth = container.clientWidth || container.offsetWidth || 575;

    // Create chart
    chartRef.current = createChart(container, {
      width: containerWidth,
      height: isFullscreen ? window.innerHeight - 120 : height,
      layout: {
        background: { type: ColorType.Solid, color: "#000000" },
        textColor: "#e5e7eb",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.08)", style: LineStyle.Dotted },
        horzLines: { color: "rgba(255,255,255,0.08)", style: LineStyle.Dotted },
      },
      rightPriceScale: {
        borderColor: "#27272a",
        textColor: "#e5e7eb",
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: "#27272a",
        rightOffset: 0,
        barSpacing: 10,
        timeVisible: true,
        secondsVisible: false,
      },
      // Use non-magnet mode so crosshair/tooltip track the cursor exactly
      crosshair: { mode: CrosshairMode.Normal },
    });

    // Add area series with subtle green background
    lineSeriesRef.current = chartRef.current.addAreaSeries({
      lineColor: "#10b981",
      topColor: "rgba(16, 185, 129, 0.3)",
      bottomColor: "rgba(6, 95, 70, 0.2)",
      lineWidth: 2,
      priceFormat: {
        type: "custom",
        formatter: (price: number) => {
          const priceStr = price.toString();
          const [intPart, decPart] = priceStr.split('.');
          const totalDigits = 7;
          const intDigits = intPart.replace('-', '').length;
          const decDigits = Math.max(0, totalDigits - intDigits);
          return price.toFixed(decDigits);
        },
        minMove: 0.0000001,
      },
    });

    // Setup tooltip on crosshair move
    chartRef.current.subscribeCrosshairMove((param: any) => {
      if (!tooltipRef.current || !lineSeriesRef.current) return;

      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.y < 0
      ) {
        tooltipRef.current.style.display = "none";
        return;
      }

      const price = param.seriesData.get(lineSeriesRef.current);
      if (!price) {
        tooltipRef.current.style.display = "none";
        return;
      }

      // Format time
      const date = new Date((param.time as number) * 1000);
      const formattedTime = date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Format price
      const formattedPrice = "$" + price.value.toFixed(8);

      // Update tooltip content
      tooltipRef.current.innerHTML = `
        <div style="font-weight: bold; color: #10b981; font-size: 16px;">${formattedPrice}</div>
        <div style="color: #d1d5db; font-size: 12px; margin-top: 4px;">${formattedTime}</div>
      `;

      // Position tooltip using fixed positioning based on mouse coordinates (restored "progress" state)
      const tooltipEl = tooltipRef.current;
      const tooltipWidth = tooltipEl.clientWidth || 0;
      const tooltipHeight = tooltipEl.clientHeight || 0;

      // Use global mouse coordinates captured on wrapper
      const cursorX = lastCursorPosRef.current.x;
      const cursorY = lastCursorPosRef.current.y;

      // Note: We used to handle zoom here, but now the Mouse Event Proxy above intercepts 
      // the event and scales the coordinates before they reach React or the library.
      // So cursorX/cursorY are already in "unzoomed" (layout) space.
      
      // Default to right of cursor
      let left = cursorX + 15;
      let top = cursorY - tooltipHeight - 15;

      // prevent tooltip from going off screen
      // Since coordinates are scaled up (e.g. 500 instead of 400), we need to check against layout dimensions too?
      // window.innerWidth returns visual viewport width?
      // With zoom 0.8, window.innerWidth might scale or not.
      // Usually we want to assume layout coordinates for the CSS.
      // If we use "fixed" position, it uses viewport coordinates.
      // Wait. If I set `left: 500px` and zoom is 0.8.
      // 500px CSS = 400px Visual.
      // This matches perfectly! My scaled coordinate (500) corresponds to the visual spot (400).
      // So I just use the scaled coordinate as CSS pixels!

      if (left + tooltipWidth > window.innerWidth) { // innerWidth is layout width usually or visual?
         // In Chrome with zoom, innerWidth acts weird, but generally CSS pixels match.
        left = cursorX - tooltipWidth - 15;
      }
      
      left = Math.max(left, 0);
      top = Math.max(top, 0);

      // Also ensure bottom doesn't overflow
      if (top + tooltipHeight > window.innerHeight) {
        top = window.innerHeight - tooltipHeight - 10;
      }

      tooltipEl.style.left = `${left}px`;
      tooltipEl.style.top = `${top}px`;
      tooltipEl.style.display = "block";
    });

    // Handle resize
    const handleResize = () => {
      if (chartRef.current && container) {
        const newWidth = container.clientWidth || container.offsetWidth || 800;
        chartRef.current.applyOptions({
          width: newWidth,
          height: isFullscreen ? window.innerHeight - 120 : height,
        });
      }
    };

    // Use ResizeObserver to detect container size changes
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    window.addEventListener("resize", handleResize);

    // Force initial resize to ensure proper layout
    requestAnimationFrame(() => {
      handleResize();
    });

    // Handle edge detection for infinite scroll
    const handleVisibleRangeChange = (logicalRange: any) => {
      if (!logicalRange || !chartRef.current) return;

      const currentFrom = logicalRange.from;

      // Skip if we just changed timeframes - wait for user to start zooming/panning
      if (justChangedTimeframe.current) {
        previousLogicalFrom.current = currentFrom;
        return;
      }

      // Check if user is actively moving left (zooming out or panning left)
      const isMovingLeft = previousLogicalFrom.current !== null && currentFrom < previousLogicalFrom.current;

      // Load more data when:
      // 1. User is near the left edge (within 10 bars of start)
      // 2. User is actively moving left (zooming/panning)
      // 3. Not already loading data
      if (currentFrom < 10 && isMovingLeft && !isLoadingMoreData.current) {
        console.log(`⬅️ Near left edge (from=${currentFrom}), user zooming/panning left, loading more historical data`);
        loadMoreHistoricalData();
      }

      // Update previous position
      previousLogicalFrom.current = currentFrom;
    };

    let rangeChangeTimeout: NodeJS.Timeout;

    const unsubscribe = chartRef.current.timeScale().subscribeVisibleLogicalRangeChange((range: any) => {
      clearTimeout(rangeChangeTimeout);
      rangeChangeTimeout = setTimeout(() => handleVisibleRangeChange(range), 150);
    });

    return () => {
      if (rangeChangeTimeout) clearTimeout(rangeChangeTimeout);
      if (unsubscribe) unsubscribe();
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        lineSeriesRef.current = null;
      }
    };
  }, [height, isFullscreen, ticker]);

  // Mouse event proxy to handle global zoom (body { zoom: 0.8 })
  // This intercepts mouse events, scales coordinates to match layout/visual mismatch,
  // and dispatches them to the chart, fixing both Crosshair and preventing double-compensation in Tooltip.
  useEffect(() => {
    if (!wrapperRef.current || !chartContainerRef.current) return;

    const wrapper = wrapperRef.current;
    
    // Helper to forward event with adjusted coordinates
    const forwardEvent = (e: MouseEvent, type: string) => {
      // Prevent infinite loop if we are seeing our own synthetic event 
      if ((e as any).__handled) return;

      // Check zoom level by comparing logical vs visual size
      // We use the wrapper's rect for this calculation
      const rect = wrapper.getBoundingClientRect();
      const logicalWidth = wrapper.offsetWidth;
      
      // Calculate scale factor (e.g., if zoom is 0.8: logical 1000px / visual 800px = 1.25)
      // If no zoom, ratio is ~1
      let scaleX = 1;
      let scaleY = 1;

      if (rect.width > 0 && Math.abs(logicalWidth - rect.width) > 1) {
        scaleX = logicalWidth / rect.width;
      }
      
      // Assume uniform zoom for Y (usually safe for 'zoom' property)
      // We can also check height if needed but often height is flexible.
      // Let's use scaleX for both as 'zoom' is uniform.
      const scale = scaleX;

      // If no zoom correction needed, let it pass (unless we want to normalize specific browser quirks)
      if (Math.abs(scale - 1) < 0.01) return;

      // Stop original event
      e.stopPropagation();
      if (e.cancelable) e.preventDefault(); 

      // Transform coordinates
      // We must scale the *distance* from the element's origin, then add the origin back.
      // This ensures that the coordinate relative to the element (offset) is scaled,
      // which is what the library uses (event.clientX - rect.left).
      
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;
      
      const adjustedX = rect.left + (relativeX * scale);
      const adjustedY = rect.top + (relativeY * scale);

      // Construct synthetic event
      const synthEvent = new MouseEvent(type, {
          bubbles: true,
          cancelable: e.cancelable,
          view: window,
          detail: e.detail,
          screenX: e.screenX,
          screenY: e.screenY,
          clientX: adjustedX, 
          clientY: adjustedY,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          shiftKey: e.shiftKey,
          metaKey: e.metaKey,
          button: e.button,
          buttons: e.buttons,
          relatedTarget: e.relatedTarget
      });
      
      (synthEvent as any).__handled = true;

      // Dispatch to the element under the VISUAL cursor
      const target = document.elementFromPoint(e.clientX, e.clientY);
      
      if (target && wrapper.contains(target)) {
          target.dispatchEvent(synthEvent);
      }
    };

    const handleMouseMove = (e: MouseEvent) => forwardEvent(e, 'mousemove');
    const handleMouseDown = (e: MouseEvent) => forwardEvent(e, 'mousedown');
    const handleMouseUp = (e: MouseEvent) => forwardEvent(e, 'mouseup');
    const handleClick = (e: MouseEvent) => forwardEvent(e, 'click');

    // Attach listeners with capture to intercept before reaching children
    wrapper.addEventListener('mousemove', handleMouseMove, { capture: true });
    wrapper.addEventListener('mousedown', handleMouseDown, { capture: true });
    wrapper.addEventListener('mouseup', handleMouseUp, { capture: true });
    wrapper.addEventListener('click', handleClick, { capture: true });

    return () => {
        wrapper.removeEventListener('mousemove', handleMouseMove, { capture: true });
        wrapper.removeEventListener('mousedown', handleMouseDown, { capture: true });
        wrapper.removeEventListener('mouseup', handleMouseUp, { capture: true });
        wrapper.removeEventListener('click', handleClick, { capture: true });
    };
  }, []);

  // Update chart data
  useEffect(() => {
    if (!lineSeriesRef.current || !chartData.length) return;

    const formattedData = formatChartData(chartData);
    if (formattedData.length > 0) {
      lineSeriesRef.current.setData(formattedData);

      if (loadedIntervalsRef.current.size === 1) {
        setTimeout(() => {
          if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
          }
        }, 100);
      }
    }
  }, [chartData]);

  // Load data when ticker/range changes
  useEffect(() => {
    if (ticker) {
      loadData(selectedRange, ticker, true);
    }
  }, [ticker, selectedRange, fakeDataEnabled]);

  // WebSocket management
  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  useEffect(() => {
    if (ticker && isConnected) {
      // Subscribe to the selected range for live updates (not active timeframe)
      subscribeToChart(ticker, selectedRange);
      return () => unsubscribeFromChart(ticker);
    }
  }, [ticker, selectedRange, isConnected]);

  // Fullscreen escape handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isFullscreen]);

  // Force data re-application when entering/exiting fullscreen
  useEffect(() => {
    if (lineSeriesRef.current && chartData.length > 0) {
      setTimeout(() => {
        const formattedData = formatChartData(chartData);
        if (formattedData.length > 0) {
          lineSeriesRef.current.setData(formattedData);
          setTimeout(() => {
            if (chartRef.current) {
              chartRef.current.timeScale().fitContent();
            }
          }, 50);
        }
      }, 150);
    }
  }, [isFullscreen, formatChartData, chartData]);

  const [showChart, setShowChart] = useState(true);

  const handleRangeClick = (range: string) => {
    if (range !== selectedRange) {
      console.log(`👆 Manual selection: ${range}`);

      // Set flag to prevent automatic data loading right after timeframe change
      justChangedTimeframe.current = true;
      previousLogicalFrom.current = null; // Reset previous position

      setSelectedRange(range);
      setActiveTimeframe(range); // Reset active timeframe to manual selection
      activeTimeframeRef.current = range; // Update ref immediately
      setTimeout(() => updateChartConfig(range), 100); // Update chart config

      // Clear the flag after 1 second to allow user-initiated zoom/pan to trigger loading
      setTimeout(() => {
        justChangedTimeframe.current = false;
      }, 1000);
    }
  };

  const FullscreenIcon = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );

  const ExitFullscreenIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  );

  return (
    <div
      className={`${isFullscreen ? "fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center p-4" : "w-full"}`}
    >
      <div
        className={`${isFullscreen ? "w-[95vw] h-[85vh]" : "w-full"} bg-black overflow-hidden flex flex-col`}
        style={{ border: 'none' }}
      >
        {/* Header */}
        <div className="p-4  h-[52px] ">
          <div className="flex items-center justify-between">
            {/* <h3 className="text-lg font-semibold text-white">
              {title} {ticker && `— ${ticker}`}
            </h3> */}
            <div className="flex space-x-1 -mt-6 -ml-4">
            </div>
            <div className="flex items-center space-x-3">


              <div
                className="relative bottom-4 left-4 p-2 flex items-center  gap-4"
                style={{
                  background: '#000',
                  transform: 'translateY(1px)',
                }}
              >

                <ul className="flex gap-1 pt-0.5">
                  {RANGE_OPTIONS.map((option) => (
                    <li
                      key={option.value}
                      onClick={() => handleRangeClick(option.value)}
                      className={`cursor-pointer px-3 py-1 rounded-md text-[13px] font-medium transition-all ${activeTimeframe === option.value
                        ? 'bg-green-300 text-black'
                        : 'text-neutral-300 hover:bg-neutral-700  hover:text-neutral-300 border border-neutral-700'
                        }`}
                    >
                      {option.label}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Fullscreen button */}
              {/* <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded transition-colors border border-neutral-600"
                title={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
              >
                {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
              </button> */}
            </div>
          </div>
        </div>

        {/* Chart container */}
        {showChart && (
          <div
            ref={wrapperRef}
            onMouseMove={(e) => {
              lastCursorPosRef.current = {
                x: e.clientX,
                y: e.clientY,
              };
            }}
            className={`relative p-1  ${isFullscreen ? "flex-1 " : ""}`}
            style={{ border: 'none' }}
          >
            {loading && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                <div className="text-sm text-neutral-400">Loading...</div>
              </div>
            )}
            {loadingDynamic && (
              <div className="absolute top-2 right-2 bg-black/70 px-3 py-1 rounded-full z-20 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-xs text-emerald-400">Loading more data...</div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                <div className="text-sm text-red-400">{error}</div>
              </div>
            )}
            {!loading && !error && chartData.length === 0 && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                <div className="text-sm text-neutral-400">
                  No data available for {ticker}
                </div>
              </div>
            )}
            <div
              ref={chartContainerRef}
              className={isFullscreen ? "flex-1" : ""}
              style={{
                width: "100%",
                height: isFullscreen ? "100%" : `${height}px`,
                backgroundColor: "#000000",
              }}
            />
            {/* Tooltip */}
            <div
              ref={tooltipRef}
              style={{
                position: "fixed",
                display: "none",
                padding: "10px 15px",
                background: "rgba(0, 0, 0, 0.5)",
                color: "white",
                borderRadius: "6px",
                pointerEvents: "none",
                zIndex: 9999,
                fontSize: "14px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

LightweightChart.displayName = "LightweightChart";
