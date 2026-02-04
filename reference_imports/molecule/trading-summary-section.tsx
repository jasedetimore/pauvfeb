import React from "react";
import { Skeleton } from "@/components/atoms/skeleton";

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
}

type MetricBase = {
  key: string;
  label: string;
  value: string;
};

type MetricWithColor = MetricBase & {
  colored: number | undefined;
};

type MetricWithoutColor = MetricBase;

type Metric = MetricWithColor | MetricWithoutColor;

interface TradingSummaryProps {
  singleIssuerData?: SingleIssuerData | null;
  singleIssuerLoading?: boolean;
  onRefresh: () => void;
}

export const TradingSummarySection: React.FC<TradingSummaryProps> = ({
  singleIssuerData,
  singleIssuerLoading,
  onRefresh,
}) => {
  // Use singleIssuerData when available, fallback to ltm
  const isLoading = singleIssuerLoading;

  const metrics = [
    [
      {
        key: "trading_volume_24h",
        label: "24h Volume",
        value:
          singleIssuerData?.trading_volume_24h != null
            ? "$" +
              singleIssuerData.trading_volume_24h.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "—",
      },
      {
        key: "circulating_supply",
        label: "Circulating Supply",
        value:
          singleIssuerData?.circulating_supply != null
            ? singleIssuerData.circulating_supply.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "—",
      },
    ],
    [
      {
        key: "number_of_holders",
        label: "Holders",
        value:
          singleIssuerData?.number_of_holders != null
            ? singleIssuerData.number_of_holders.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "—",
      },
      {
        key: "total_value_usdp",
        label: "Total Value (USDP)",
        value:
          singleIssuerData?.total_value_usdp != null
            ? "$" +
              singleIssuerData.total_value_usdp.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "—",
      },
    ],
    [
      {
        key: "price_change_24h",
        label: "24h Price Change",
        value:
          singleIssuerData?.price_24h_change != null
            ? (Number(singleIssuerData.price_24h_change) > 0 ? "+" : "") +
              Number(singleIssuerData.price_24h_change).toFixed(2) +
              "%"
            : "—",
        colored: singleIssuerData?.price_24h_change,
      },
      {
        key: "price_change_7d",
        label: "7d Price Change",
        value:
          singleIssuerData?.price_7d_change != null
            ? (Number(singleIssuerData.price_7d_change) > 0 ? "+" : "") +
              Number(singleIssuerData.price_7d_change).toFixed(2) +
              "%"
            : "—",
        colored: singleIssuerData?.price_7d_change,
      },
    ],
  ];

  // Show skeleton loading state when loading initial data
  if (isLoading && !singleIssuerData) {
    return (
      <div>
        <div className="flex items-center justify-between my-2.5">
          <h2 className="font-mono text-[1.25rem] font-semibold">Quick Stats</h2>
          <Skeleton width="48px" height="20px" rounded={true} />
        </div>
        <div className="p-3 pl-4 w-full bg-neutral-900 border border-neutral-700 rounded-[10px]">
          {[1, 2, 3].map((_, groupIndex) => (
            <div key={groupIndex}>
              <div className="grid grid-cols-2 gap-1 py-1">
                {[1, 2].map((metricIndex) => (
                  <div key={metricIndex} className="">
                    <Skeleton width="80px" height="10px" className="mb-1" />
                    <Skeleton width="60%" height="1rem" />
                  </div>
                ))}
              </div>
              {groupIndex < 2 && (
                <div className="border-t border-neutral-600 my-3"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between my-2.5">
        <h2 className="font-mono text-[1.25rem] font-semibold">Quick Stats</h2>
        <button
          onClick={() => {}}
          className="text-xs px-3 py-1 bg-black text-white rounded border border-neutral-600 hover:bg-neutral-900 transition-colors"
        >
          Refresh
        </button>
      </div>
      <div className="p-3 pl-4 w-full bg-neutral-900 border border-neutral-700 rounded-[10px] hover:bg-neutral-800 transition-colors">
        {metrics.map((group, groupIndex) => (
          <div key={groupIndex}>
            <div className="grid grid-cols-2 gap-1 py-1">
              {group.map((metric) => (
                <div key={metric.key} className="">
                  <div className="text-[10px] uppercase font-light tracking-wide opacity-80 mb-1">
                    {metric.label}
                  </div>
                  <div
                    className={`font-mono text-2xl leading-tight ${
                      metric.key === 'total_value_usdp' ? 'whitespace-nowrap overflow-hidden text-ellipsis' : 'break-words'
                    }`}
                    style={{
                      fontSize: "1.0rem",
                      color:
                        ('colored' in metric) && metric.colored != null && metric.value !== "—"
                          ? metric.colored > 0
                            ? "#10b981"
                            : metric.colored < 0
                              ? "#ef4444"
                              : "#888"
                          : undefined,
                    }}
                  >
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
            {groupIndex < metrics.length - 1 && (
              <div className="border-t border-neutral-600 my-3"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
