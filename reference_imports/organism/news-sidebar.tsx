import { useNews } from "@/hooks/use-news";
import { useAuthFast } from "@/hooks/use-auth-fast";
import { useUserOrdersInfiniteFast } from "@/hooks/use-user-orders";
import React from "react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { TradingFormSimple } from "@/components/molecules/trading-form-simple";
import { OwnershipHistorySection } from "@/components/molecules/ownership-history-section";

interface NewsSidebarProps {
  primary_tag?: string;
  ticker?: string;
  price?: number;
  pvAmount?: string;
  setPvAmount?: (amount: string) => void;
  onBuy?: () => void;
  onSell?: () => void;
  submitting?: boolean;
  selectedTradeId?: string | null;
  onBackToLive?: () => void;
  tradeError?: string | null;
  processingInfo?: { iterations: number; processed: boolean } | null;
  queuedOrders?: Set<string>;
  processingOrderType?: "buy" | "sell" | null;
  pnlProcessingOrders?: Set<string>;
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

export const NewsSidebar: React.FC<NewsSidebarProps> = ({
  primary_tag,
  ticker,
  price,
  pvAmount = "",
  setPvAmount = () => {},
  onBuy = () => {},
  onSell = () => {},
  submitting = false,
  selectedTradeId = null,
  onBackToLive = () => {},
  tradeError = null,
  processingInfo = null,
  queuedOrders = new Set(),
  processingOrderType = null,
  pnlProcessingOrders = new Set(),
}) => {
  const [showAllOrders, setShowAllOrders] = useState(false);

  const { userId, session, isAuthenticated } = useAuthFast();

  // Fetch news based on primary_tag from single issuer data
  const { newsStories, newsLoading, refetchNews } = useNews({
    tag: primary_tag || null,
    limit: 20,
    enabled: !!primary_tag,
  });

  // Fetch user orders for ownership history
  const { data: ordersData, isLoading: ordersLoading } =
    useUserOrdersInfiniteFast(userId, { limit: 20, ticker }, session);

  const allOrders = ordersData?.pages.flatMap((page) => page.orders) || [];
  const hasOrders = allOrders.length > 0 && isAuthenticated;
  return (
    <>
      <aside
        data-slot="right"
        data-section="right-sidebar"
        className="pb-16 md:pt-4 bg-black flex flex-col shrink-0 md:w-[350px] lg:w-[24%] sm:px-2 lg:px-0 lg:pl-0 sm:pl-4"
      >
        <div className="h-auto md:h-full overflow-visible md:overflow-y-auto scroll-hidden scroll-smooth ">
          <div className="pr-2 pb-2 space-y-2 text-neutral-200 text-sm">
            {/* <div className="font-light text-white text-[1.1rem] opacity-70">News</div> */}

            {/* Trading Form Section */}
            <div className="mt-0">
              <div className="flex items-center justify-between my-2.5">
                <label className="block font-mono text-[1.25rem] font-semibold">
                  Place Order
                </label>
                <button
                  onClick={() => {}}
                  className="text-xs px-3 py-1 bg-black text-white rounded border border-neutral-600 hover:bg-neutral-900 transition-colors"
                >
                  Refresh
                </button>
              </div>
              <div className="bg-black" style={{ border: 'none', padding: '0' }}>
                <TradingFormSimple
                  pvAmount={pvAmount}
                  setPvAmount={setPvAmount}
                  onBuy={onBuy}
                  onSell={onSell}
                  submitting={submitting}
                  selectedTradeId={selectedTradeId}
                  onBackToLive={onBackToLive}
                  tradeError={tradeError}
                  processingInfo={processingInfo}
                  ticker={ticker}
                  price={price}
                  queuedOrders={queuedOrders}
                  processingOrderType={processingOrderType}
                  pnlProcessingOrders={pnlProcessingOrders}
                />
              </div>
            </div>

            {/* Ownership History Section */}
            {hasOrders && (
              <>
                <div className="flex items-center justify-between my-2.5">
                  <h2 className="font-mono text-[1.25rem] font-semibold">Your Buy/Sell History</h2>
                  <button
                    onClick={() => {}}
                    className="text-xs px-3 py-1 bg-black text-white rounded border border-neutral-600 hover:bg-neutral-900 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
                <div className="p-2 bg-neutral-900 border border-neutral-700 rounded-[10px]">
                  <OwnershipHistorySection 
                    ticker={ticker} 
                    limit={5}
                  />
                  <button
                    onClick={() => setShowAllOrders(true)}
                    className="w-full text-md text-white underline hover:text-neutral-200 cursor-pointer transition-colors mt-2"
                  >
                    View All
                  </button>
                </div>
              </>
            )}
            
            {/* News Section */}
            {newsLoading && (
              <div className="w-full">
                <div className="flex items-center justify-between my-2.5">
                  <div className="h-5 bg-neutral-700 rounded w-16 animate-pulse"></div>
                  <div className="h-7 bg-neutral-700 rounded w-16 animate-pulse"></div>
                </div>
                <div className="bg-neutral-900 border border-neutral-700 rounded-[10px] w-full">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="w-full">
                      <div className="p-3 animate-pulse w-full">
                        <div className="flex items-center justify-between mb-2 w-full">
                          <div className="h-3 bg-neutral-700 rounded w-20"></div>
                          <div className="h-3 bg-neutral-700 rounded w-24"></div>
                        </div>
                        <div className="space-y-2 mb-2 w-full">
                          <div className="h-3 bg-neutral-700 rounded w-full"></div>
                          <div className="h-3 bg-neutral-700 rounded w-[90%]"></div>
                          <div className="h-3 bg-neutral-700 rounded w-[75%]"></div>
                        </div>
                        <div className="h-3 bg-neutral-700 rounded w-20"></div>
                      </div>
                      {index < 4 && (
                        <div className="border-t border-neutral-700"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {!newsLoading && newsStories.length > 0 && (
              <>
                <div className="flex items-center justify-between my-2.5">
                  <h2 className="font-mono text-[1.25rem] font-semibold">News</h2>
                  <button
                    onClick={() => {}}
                    className="text-xs px-3 py-1 bg-black text-white rounded border border-neutral-600 hover:bg-neutral-900 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
                <div className="bg-neutral-900 border border-neutral-700 rounded-[10px] p-0.5">
                  {newsStories.map((story, index) => (
                  <div key={story.news_id || index}>
                    <div className="p-3  hover:bg-neutral-800 transition-colors cursor-pointer">
                      <div className="text-xs text-neutral-400 mb-1 flex items-center justify-between">
                        <span>
                          {story.created_at
                            ? new Date(story.created_at).toLocaleDateString()
                            : "Today"}
                        </span>
                        <span className="font-medium text-neutral-300">
                          {story.source}
                        </span>
                      </div>
                      <div className="text-sm text-white leading-tight mb-2">
                        {story.headline}
                      </div>
                      <div className="text-xs text-neutral-400">
                        by {story.author}
                      </div>
                    </div>
                    {index < newsStories.length - 1 && (
                      <div className="border-t border-neutral-700"></div>
                    )}
                  </div>
                ))}
              </div>
              </>
            )}

            {!newsLoading && newsStories.length === 0 && (
              <div className="text-xs opacity-70">
                No news stories available.
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Orders Popup Modal - Rendered via Portal */}
      {showAllOrders &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Left half - blurred backdrop with content visible but blurred */}
            <div
              className="fixed top-0 left-0 w-full md:w-1/2 h-screen bg-black/20 backdrop-blur-xs"
              style={{ zIndex: 60 }}
              onClick={() => setShowAllOrders(false)}
            ></div>

            {/* Right half - popup panel */}
            <div
              className="fixed top-0 right-0 md:right-2 h-screen w-full md:w-1/2 bg-neutral-900 overflow-hidden flex flex-col md:rounded-l-[15px]"
              style={{ zIndex: 60 }}
            >
              <div className="px-3 pl-4 py-3 md:px-2 md:pl-4 md:py-3 bg-neutral-900 flex justify-between items-center border-b border-neutral-700">
                <h2 className="text-base md:text-light font-normal text-white">
                  Your Buy/Sell History
                </h2>
                <div className="flex items-center gap-2 md:gap-3">
                  <button
                    onClick={() => setShowAllOrders(false)}
                    className="text-neutral-400 hover:bg-neutral-700 rounded p-2 text-lg md:text-xl touch-manipulation"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <OwnershipHistorySection ticker={ticker} />
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
};
