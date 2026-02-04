import { useIssuerHoldersInfinite } from "@/hooks/use-issuer-holders";
import React, { useCallback, useEffect, useRef } from "react";

interface HoldersSectionProps {
  ticker: string;
}

const HolderSkeleton = () => (
  <tr className="odd:bg-neutral-800/40 animate-pulse">
    <td className="px-3 py-2">
      <div className="h-3 bg-neutral-700 rounded w-20"></div>
    </td>
    <td className="px-3 py-2">
      <div className="h-3 bg-neutral-700 rounded w-14"></div>
    </td>
    <td className="px-3 py-2">
      <div className="h-3 bg-neutral-700 rounded w-18"></div>
    </td>
  </tr>
);

export const HoldersSection: React.FC<HoldersSectionProps> = ({ ticker }) => {
  const {
    data,
    isLoading: holdersLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error: holdersError,
    refetch,
  } = useIssuerHoldersInfinite(ticker, 20);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Flatten all holders from all pages
  const allHolders = data?.pages.flatMap((page) => page.holders) || [];

  // Intersection Observer for infinite scroll
  const observerTarget = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
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

  // Helper function to invalidate holders queries
  const onRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-2 sm:pb-2 ">
      <div className="flex items-center justify-between my-2.5">
        <h2 className="font-mono text-[1.25rem] font-semibold">PV Holders</h2>
        <button
          onClick={() => {}}
          className="text-xs px-3 py-1 bg-black text-white rounded border border-neutral-600 hover:bg-neutral-900 transition-colors"
        >
          Refresh
        </button>
      </div>
      <div
        className="p-2 overflow-hidden bg-neutral-900 border border-neutral-700 rounded-[10px] hover:bg-neutral-800 transition-colors"
        data-section="holders"
      >
        {holdersError && (
          <div className="p-4 text-[11px] text-red-500">
            {holdersError instanceof Error
              ? holdersError.message
              : "Failed to load holders"}
          </div>
        )}

        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-auto h-auto max-h-96"
        >
          <table className="min-w-full text-xs font-mono ">
            <thead className="sticky top-0 text-neutral-300 z-10 ">
              <tr>
                <th className="text-left px-3 py-2 font-medium w-[140px] max-w-[140px]">
                  User
                </th>
                <th className="text-right px-3 py-2 font-medium">Quantity</th>
                <th className="text-right px-3 py-2 font-medium w-[90px] max-w-[90px]">Supply</th>
              </tr>
            </thead>
            <tbody>
              {/* Show loading skeletons during initial load */}
              {holdersLoading &&
                Array.from({ length: 8 }).map((_, index) => (
                  <HolderSkeleton key={`skeleton-${index}`} />
                ))}

              {/* Show no holders message */}
              {!holdersLoading && (!allHolders || allHolders.length === 0) && (
                <tr>
                  <td className="px-3 py-2 text-xs opacity-60" colSpan={3}>
                    No holder data available.
                  </td>
                </tr>
              )}

              {/* Render actual holders */}
              {!holdersLoading &&
                allHolders &&
                allHolders.map((holder, index) => {
                  if (!holder || !holder.id) return null;

                  const qtyStr = holder.quantity.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 8,
                  });
                  const pctStr =
                    holder.percentage != null
                      ? Number(holder.percentage).toLocaleString(undefined, {
                          minimumFractionDigits: 4,
                          maximumFractionDigits: 4,
                        }) + "%"
                      : "—";

                  // Truncate username to 16-18 characters
                  const displayUsername = holder.username.length > 18
                    ? holder.username.substring(0, 16) + "..."
                    : holder.username;

                  return (
                    <tr
                      key={`${holder.id}-${index}`}
                      className="odd:bg-neutral-800/40 "
                    >
                      <td className="px-3 py-2 whitespace-nowrap max-w-[140px] truncate" title={holder.username}>
                        {displayUsername}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-right tabular-nums">
                        {qtyStr}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums" style={{
                        color: holder.percentage != null && holder.percentage > 0 ? "#10b981" : holder.percentage != null && holder.percentage < 0 ? "#ef4444" : undefined
                      }}>
                        {pctStr}
                      </td>
                    </tr>
                  );
                })}

              {/* Loading skeleton rows for infinite loading */}
              {isFetchingNextPage &&
                Array.from({ length: 3 }).map((_, index) => (
                  <HolderSkeleton key={`pagination-skeleton-${index}`} />
                ))}
              
              {/* Sentinel for IntersectionObserver */}
              <tr ref={observerTarget} style={{ height: '1px' }}></tr>
            </tbody>
          </table>

          {/* End of data indicator */}
          {/* {!holdersLoading && !hasNextPage && allHolders.length > 0 && (
            <div className="p-3 text-center text-[11px] text-neutral-500 border-t border-neutral-700">
              No more holders to load
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};
