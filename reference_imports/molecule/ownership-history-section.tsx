import React, { useCallback, useEffect, useRef } from "react";
import { useAuthFast } from "@/hooks/use-auth-fast";
import { useUserOrdersInfiniteFast } from "@/hooks/use-user-orders";

interface OwnershipHistorySectionProps {
  ticker?: string;
  limit?: number;
  onViewAll?: () => void;
  onRefetchReady?: (refetch: () => void) => void;
}

// Skeleton loader component
const OrderSkeleton = ({ isLimited = false }) => (
  <tr className="border-b border-neutral-800 animate-pulse">
    <td className="px-4 py-2">
      <div className="h-3 bg-neutral-700 rounded w-16"></div>
    </td>
    <td className="px-4 py-2">
      <div className="h-3 bg-neutral-700 rounded w-12"></div>
    </td>
    <td className="px-4 py-2 text-center">
      <div className="h-3 bg-neutral-700 rounded w-8 mx-auto"></div>
    </td>
    <td className="px-4 py-2 text-right">
      <div className="h-3 bg-neutral-700 rounded w-20 ml-auto"></div>
    </td>
    <td className="px-4 py-2 text-right">
      <div className="h-3 bg-neutral-700 rounded w-20 ml-auto"></div>
    </td>
    <td className="px-4 py-2 text-right">
      <div className="h-3 bg-neutral-700 rounded w-20 ml-auto"></div>
    </td>
    <td className="px-4 py-2 text-center">
      <div className="h-3 bg-neutral-700 rounded w-8 mx-auto"></div>
    </td>
  </tr>
);

export const OwnershipHistorySection: React.FC<
  OwnershipHistorySectionProps
> = ({ ticker, limit, onViewAll, onRefetchReady }) => {
  const {
    userId,
    user,
    isAuthenticated: currentlyAuthenticated,
    session,
  } = useAuthFast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [expandedOrderId, setExpandedOrderId] = React.useState<string | null>(null);

  // Use infinite query - triggers as soon as we have userId
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
    invalidateUserOrders,
  } = useUserOrdersInfiniteFast(
    userId,
    {
      limit: 20,
      ticker,
    },
    session
  );

  // Expose refetch function to parent
  React.useEffect(() => {
    if (onRefetchReady) {
      onRefetchReady(refetch);
    }
  }, [refetch, onRefetchReady]);

  // Flatten all orders from all pages
  const allOrders = data?.pages.flatMap((page) => page.orders) || [];
  const displayedOrders = limit ? allOrders.slice(0, limit) : allOrders;

  // Calculate summary statistics
  const summary = React.useMemo(() => {
    let totalBuy = 0;
    let totalSell = 0;
    let totalRealizedPL = 0;
    let totalUnrealizedPnl = 0;

    allOrders.forEach((order) => {
      const quantity = parseFloat(order.quantity || "0");
      const realizedPl = parseFloat(order.realized_pl || "0");
      const unrealizedPnl = parseFloat(order.unrealized_pnl || "0");

      if (order.order_type === "buy") {
        totalBuy += quantity;
        totalUnrealizedPnl += unrealizedPnl;
      } else if (order.order_type === "sell") {
        totalSell += quantity;
        totalRealizedPL += realizedPl;
      }
    });

    const currentHoldings = totalBuy - totalSell;

    return {
      totalBuy,
      totalSell,
      currentHoldings,
      totalRealizedPL,
      totalUnrealizedPnl,
      hasHoldings: currentHoldings > 0,
    };
  }, [allOrders]);

  // Note: WebSocket connection is now managed by the parent component (page.tsx)
  // The useMarketWebSocket hook in page.tsx handles user orders subscriptions
  // automatically when userId is provided. Real-time updates will be received
  // through the onUserOrdersUpdate callback, which invalidates the user-orders
  // query cache, causing this component to refetch automatically.

  // For standalone usage, we could show a connection indicator but won't
  // create a separate WebSocket connection to avoid duplicates.
  // const isConnected = true; // Always show as connected since parent manages WS

  // Intersection Observer for infinite scroll
  const observerTarget = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          console.log("🔄 Triggering fetchNextPage via IntersectionObserver!");
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Don't show component if not authenticated or no userId yet
  if (!currentlyAuthenticated && !userId) {
    return null;
  }

  return (
    <div
      className={`${limit ? "" : "h-full flex flex-col"} ${!limit ? "" : ""}`}
    >
      <div className={`${limit ? "" : "h-full"} bg-neutral-900 p-0 flex flex-col ${!limit ? "border border-neutral-700 rounded-b-2xl" : "border border-neutral-700 rounded-[10px]"}`}>
      {!limit && (
        <div className="p-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
          {/* Real-time connection indicator */}
          {/* {!limit && (
            <div className="flex items-center gap-1.5 text-xs">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-neutral-400">
                {isConnected ? "Live" : "Offline"}
              </span>
            </div>
          )} */}
          {/* <button
            className="text-xs px-2 py-0.5 rounded border border-neutral-600 hover:bg-neutral-800 disabled:opacity-50"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing…" : "Refresh"}
          </button> */}
          </div>
        </div>
      )}

      {error && (
        <div className="px-3 pb-3 text-[11px] text-red-500">
          {error instanceof Error ? error.message : "Failed to load orders"}
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className={`overflow-x-auto overflow-y-auto ${limit ? "h-auto max-h-97" : "flex-1"}`}
      >
        <table className="min-w-full text-xs">
          <thead
            className={`sticky top-0 bg-neutral-900 ${!limit ? "text-neutral-200" : "text-neutral-200"} z-10`}
          >
            <tr>
              {!limit ? (
                // Full table headers with sort icons (no limit)
                <>
                  <th className="text-left px-4 py-2 font-normal">
                    <div className="flex items-center gap-1.5">
                      Date & Time
                      {/* <svg
                        width="10"
                        height="14"
                        viewBox="0 0 10 14"
                        fill="currentColor"
                        className="text-neutral-500"
                      >
                        <path d="M5 1 L8 4 L2 4 Z" />
                        <path d="M5 13 L2 10 L8 10 Z" />
                      </svg> */}
                    </div>
                  </th>
                  <th className="text-left px-4 py-2 font-normal">
                    <div className="flex items-center gap-1.5">Side</div>
                  </th>
                  <th className="text-center px-4 py-2 font-normal">
                    <div className="flex items-center justify-center gap-1.5">
                      Qty
                    </div>
                  </th>
                  <th className="text-right px-4 py-2 font-normal">
                    <div className="flex items-center justify-end gap-1.5">
                      Price
                    </div>
                  </th>
                  <th className="text-right px-4 py-2 font-normal">
                    <div className="flex items-center justify-end gap-1.5">
                      Cost
                    </div>
                  </th>
                  <th className="text-right px-4 py-2 font-normal">
                    <div className="flex items-center justify-end gap-1.5">
                      P/L
                    </div>
                  </th>
                  <th className="text-center px-2 py-2 font-normal w-16">
                    <div className="flex items-center justify-center gap-1.5">
                      Details
                    </div>
                  </th>
                  {/* <th className="text-right px-4 py-3 font-normal">
                    <div className="flex items-center justify-end gap-1.5">
                      Total
                      <svg
                        width="10"
                        height="14"
                        viewBox="0 0 10 14"
                        fill="currentColor"
                        className="text-neutral-500"
                      >
                        <path d="M5 1 L8 4 L2 4 Z" />
                        <path d="M5 13 L2 10 L8 10 Z" />
                      </svg>
                    </div>
                  </th> */}
                </>
              ) : (
                // Simple table headers (with limit)
                <>
                  <th className="text-left px-2 py-2 font-medium">Type</th>
                  <th className="text-right px-2 py-2 font-medium">Qty</th>
                  <th className="text-right px-2 py-2 font-medium">P/L</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {/* Show loading skeletons during initial load */}
            {isLoading &&
              Array.from({ length: 8 }).map((_, index) => (
                <OrderSkeleton key={`skeleton-${index}`} />
              ))}

            {/* Show no transactions message */}
            {!isLoading && (!allOrders || allOrders.length === 0) && (
              <tr>
                <td
                    className={`${!limit ? "px-4 py-2" : "px-3 py-2"} text-xs opacity-60`}
                  colSpan={!limit ? 7 : 4}
                >
                  No transactions.
                </td>
              </tr>
            )}

            {/* Render actual orders */}
            {!isLoading &&
              displayedOrders.map((order, index) => {
                if (!order || !order.id) return null;

                const quantity = parseFloat(order.quantity || "0");
                const price = parseFloat(order.price || "0");
                const finalCost = parseFloat(order.final_cost || "0");
                const issuerFeePV = parseFloat(order.issuer_fee || "0"); // issuer_fee is in PV
                const issuerFeeUSD = issuerFeePV * price; // Convert to USDP
                const serverFee = parseFloat(order.server_fee || "0");
                const spread = parseFloat(order.spread || "0");
                const realizedPl = parseFloat(order.realized_pl || "0");
                const unrealizedPnl = parseFloat(order.unrealized_pnl || "0");
                const isBuyOrder = order.order_type?.toLowerCase() === "buy";

                const isExpanded = expandedOrderId === order.id;

                const sideColor =
                  order.order_type?.toLowerCase() === "buy"
                    ? "text-emerald-400"
                    : order.order_type?.toLowerCase() === "sell"
                      ? "text-red-400"
                      : "";

                // For buy orders, show unrealized P/L; for sell orders, show realized P/L
                const pnlValue = isBuyOrder ? unrealizedPnl : realizedPl;
                const pnlColor =
                  pnlValue > 0
                    ? "text-emerald-500"
                    : pnlValue < 0
                      ? "text-red-500"
                      : "";

                return !limit ? (
                  // Full table row (no limit)
                  <React.Fragment key={`${order.id}-${index}`}>
                  <tr
                    className={`${index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-800/50"} text-white`}
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-xs">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            }
                          )
                        : "—"}
                    </td>
                    <td className={`px-4 py-2 text-xs ${sideColor}`}>
                      {order.order_type?.toUpperCase() || "—"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-center text-xs">
                      {isNaN(quantity) ? "—" : quantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " PV"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-xs">
                      {isNaN(price) ? "—" : "$" + price.toLocaleString('en-US', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}
                    </td>

                    <td className="px-4 py-2 whitespace-nowrap text-right text-xs">
                      {isNaN(finalCost) ? "—" : "$" + finalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td
                      className={`px-4 py-2 whitespace-nowrap text-right text-xs ${pnlColor}`}
                    >
                      {order.pnl_calculated && pnlValue !== 0
                        ? (pnlValue >= 0 ? "+" : "") + "$" + pnlValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : "—"}
                    </td>

                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="text-neutral-400 hover:text-neutral-200 transition-colors"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        >
                          <path d="M8 11L3 6h10z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-neutral-800/30">
                      <td colSpan={7} className="px-4 py-2">
                        <div className="text-xs">
                          <div className="font-semibold text-neutral-300 mb-1">Cost Breakdown</div>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">
                            <div className="flex gap-2">
                              <span className="text-neutral-400">Base Cost:</span>
                              <span className="text-neutral-200">${(finalCost - issuerFeeUSD - serverFee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-neutral-400">Issuer Fee:</span>
                              <span className="text-neutral-200" title={`${issuerFeePV.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} PV`}>${issuerFeeUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-neutral-400">Server Fee:</span>
                              <span className="text-neutral-200">${serverFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-neutral-400">Spread:</span>
                              <span className="text-neutral-200">${spread.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex gap-2 font-semibold border-t border-neutral-700 pt-1 mt-1 col-span-2">
                              <span className="text-neutral-300">Total Cost:</span>
                              <span className="text-neutral-100">${finalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ) : (
                  // Simple table row (with limit)
                  <tr
                    key={`${order.id}-${index}`}
                    className="odd:bg-neutral-800/40"
                  >
                    <td className={`px-2 py-2 font-semibold text-sm ${sideColor}`}>
                      {order.order_type?.toUpperCase() || "—"}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-right text-sm">
                      {isNaN(quantity) ? "—" : quantity.toFixed(0) + " PV"}
                    </td>

                    <td
                      className={`px-2 py-2 whitespace-nowrap text-right text-sm ${pnlColor}`}
                    >
                      {order.pnl_calculated && pnlValue !== 0
                        ? (pnlValue >= 0 ? "+" : "") + "$" + pnlValue.toFixed(2)
                        : "—"}
                    </td>
                  </tr>
                );
              })}

            {/* Loading skeleton rows for infinite loading */}
            {isFetchingNextPage &&
              Array.from({ length: 3 }).map((_, index) => (
                <OrderSkeleton key={`pagination-skeleton-${index}`} />
              ))}
            
            {/* Sentinel for IntersectionObserver */}
            <tr ref={observerTarget} style={{ height: '1px' }}></tr>
          </tbody>
        </table>

        {/* End of data indicator */}
        {!limit && !isLoading && !hasNextPage && allOrders.length > 0 && (
          <div className="p-4 text-center text-xs text-neutral-500 border-t border-neutral-800">
            No more transactions to load
          </div>
        )}
      </div>

      {/* Summary Section */}
      {!limit && !isLoading && allOrders.length > 0 && (
        <div
          className={`bg-neutral-800/60 p-4 text-[11px] font-mono ${!limit ? "mx-3 mb-3 rounded-lg" : ""}`}
        >
          <div className="flex flex-col gap-3">
            {/* Current Holdings - only show if user has holdings */}
            {!limit && summary.hasHoldings && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 font-medium">
                  Current Holdings:
                </span>
                <span className="font-mono font-semibold text-emerald-400">
                  {summary.currentHoldings.toLocaleString(undefined, {
                    maximumFractionDigits: 8,
                  })}{" "}
                  {ticker || "PV"}
                </span>
              </div>
            )}

            {/* Total Realized P/L */}
            {/* <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium">
                Total Realized P/L:
              </span>
              <span
                className={`font-mono font-semibold ${
                  summary.totalRealizedPL > 0
                    ? "text-emerald-400"
                    : summary.totalRealizedPL < 0
                      ? "text-red-400"
                      : "text-neutral-300"
                }`}
              >
                {summary.totalRealizedPL >= 0 ? "+" : ""}
                {summary.totalRealizedPL.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                USD
              </span>
            </div> */}

            {/* Total Unrealized P/L */}
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium">
                Total Unrealized P/L:
              </span>
              <span
                className={`font-mono font-semibold ${
                  summary.totalUnrealizedPnl > 0
                    ? "text-emerald-400"
                    : summary.totalUnrealizedPnl < 0
                      ? "text-red-400"
                      : "text-neutral-300"
                }`}
              >
                {summary.totalUnrealizedPnl >= 0 ? "+" : ""}
                {summary.totalUnrealizedPnl.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                USD
              </span>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
