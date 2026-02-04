import React, { useEffect, useState } from "react";
import { PriceDisplay } from "@/components/atoms/price-display";
import { SocialMediaLinks } from "@/components/atoms/social-media-links";
import { TradingSummarySection } from "@/components/molecules/trading-summary-section";
import { IndexesSection } from "@/components/molecules/indexes-section";
import { HoldersSection } from "@/components/molecules/holders-section";
import { SimpleIssuerCard } from "@/components/molecules/simple-issuer-card";
import { issuersAPI } from "@/lib/api-helpers";
import { BuySellBar } from "./buySellbar";
import { OrderStatisticsResponse } from "@/types/market";
import { useNewestIssuers } from "@/hooks/use-newest-issuers";
interface Index {
  index_name: string;
  index_ticker: string;
  total_value: number | null;
  current_price: number | null;
}

interface SingleIssuerData {
  snapshot_id: string;
  current_lp_id: string;
  initial_lp_id: string;
  auction_id: string;
  issuer_id: string;
  ticker: string;
  full_name: string;
  created_timestamp: string;
  last_calc_timestamp: string;
  phantd_amount: string;
  x_reserve: string;
  usdp_amount: string;
  pv_reserve: string;
  price: string;
  initial_k: string;
  current_k: string | null;
  initial_price: string;
  image_url: string;
  description: string;
  // Enhanced market data fields
  price_1h_change: number;
  price_24h_change: number;
  price_7d_change: number;
  number_of_holders: number;
  circulating_supply: number;
  total_value_usdp: number;
  trading_volume_5min: number;
  trading_volume_24h: number;
  // Social media links
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  tiktok_url?: string;
  spotify_url?: string;
  linkedin_url?: string;
  whatsapp_url?: string;
}

interface LeftSidebarProps {
  displayPrice?: number | null;
  ticker?: string;
  indexes: Index[];
  indexesLoading: boolean;
  indexesError: string | null;
  singleIssuerData?: SingleIssuerData | null;
  singleIssuerLoading?: boolean;
  onRefreshMetrics: () => void;
  onRefreshIndexes: () => void;
  spreadItems: any[];
  globalOrderStats?: OrderStatisticsResponse | null;
  globalOrderStatsLoading?: boolean;
  selectedTag?: string | null;
  refetchOrderStats?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  displayPrice,
  ticker,
  indexes,
  indexesLoading,
  indexesError,
  singleIssuerData,
  singleIssuerLoading,
  onRefreshMetrics,
  onRefreshIndexes,
  spreadItems,
  globalOrderStats,
  globalOrderStatsLoading,
  selectedTag,
  refetchOrderStats,
}) => {
  const [publicIssuerData, setPublicIssuerData] = useState<any>(null);

  // Fetch newest issuers for recommendations
  const { data: newestIssuers, loading: newestIssuersLoading } = useNewestIssuers({
    limit: 3,
  });

  useEffect(() => {
    const fetchPublicData = async () => {
      if (ticker) {
        try {
          const response = await issuersAPI.getPublicProfile(ticker);
          setPublicIssuerData(response.data);
        } catch (error) {
          console.error('Failed to fetch public issuer data:', error);
        }
      }
    };

    fetchPublicData();
  }, [ticker]);

  const combinedData = {
    ...singleIssuerData,
    ...publicIssuerData
  };

  return (
    <div className="lg:col-span-1 space-y-2 bg-black">
      {/* Current Price */}
      <PriceDisplay
        price={displayPrice}
        ticker={ticker}
        loading={singleIssuerLoading}
        data={combinedData}
      />

      {/* Social Media Links */}
      <SocialMediaLinks
        twitter_url={combinedData?.twitter_url}
        instagram_url={combinedData?.instagram_url}
        tiktok_url={combinedData?.tiktok_url}
      />

      {/* Summary */}
      <TradingSummarySection
        singleIssuerData={singleIssuerData}
        singleIssuerLoading={singleIssuerLoading}
        onRefresh={onRefreshMetrics}
      />
      {/* Buy/Sell Bar */}
      <BuySellBar
        items={spreadItems}
        globalOrderStats={globalOrderStats}
        globalOrderStatsLoading={globalOrderStatsLoading}
        selectedTag={selectedTag}
        refetchOrderStats={refetchOrderStats}
      />

      {/* PV Holders */}
      <div className="mb-4">
        <HoldersSection ticker={ticker!} />
      </div>

      {/* Recommended Issuers */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-mono text-[1.25rem] font-semibold text-white">Recommended Issuers</h2>
        </div>
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden">
          {newestIssuersLoading ? (
            <div className="p-4 text-center text-neutral-500 text-sm font-mono">
              Loading...
            </div>
          ) : newestIssuers.length === 0 ? (
            <div className="p-4 text-center text-neutral-500 text-sm font-mono">
              No recommendations available
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {newestIssuers
                .filter((issuer) => issuer.ticker.toLowerCase() !== ticker?.toLowerCase())
                .slice(0, 3)
                .map((issuer) => (
                  <SimpleIssuerCard
                    key={issuer.ticker}
                    ticker={issuer.ticker}
                    fullName={issuer.full_name}
                    imageUrl={issuer.image_url}
                    currentPrice={parseFloat(issuer.current_price as any) || 0}
                    priceChange={parseFloat(issuer.price_24h_change as any) || 0}
                    primaryTag={issuer.primary_tag}
                    backgroundColor="#171717"
                    hoverBackgroundColor="#222"
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
