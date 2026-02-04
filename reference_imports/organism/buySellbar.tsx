import { BuySellSpread } from "../molecules";
import { OrderStatisticsResponse } from "@/types/market";

interface BuySellBarProps {
  items: any[];
  globalOrderStats?: OrderStatisticsResponse | null;
  globalOrderStatsLoading?: boolean;
  selectedTag?: string | null;
  refetchOrderStats?: () => void;
}

export const BuySellBar: React.FC<BuySellBarProps> = ({
  items,
  globalOrderStats,
  globalOrderStatsLoading,
  selectedTag,
  refetchOrderStats,
}) => {
  return (
    <>
      <div className="flex items-center justify-between my-2.5">
        <h2 className="font-mono text-[1.25rem] font-semibold">
          {!selectedTag && globalOrderStats && !globalOrderStatsLoading
            ? "Order Flow Analysis"
            : selectedTag
              ? `24h Buy/Sell Pressure for ${selectedTag}`
              : "24h Buy/Sell Pressure"}
        </h2>
        <button
          onClick={() => {}}
          className="text-xs px-3 py-1 bg-black text-white rounded border border-neutral-600 hover:bg-neutral-900 transition-colors"
        >
          Refresh
        </button>
      </div>
      <section className="bg-neutral-900 border border-neutral-700 rounded-[10px] transition-colors">
        <BuySellSpread
          items={items}
          globalOrderStats={globalOrderStats}
          globalOrderStatsLoading={globalOrderStatsLoading}
          selectedTag={selectedTag}
        />
      </section>
    </>
  );
};
