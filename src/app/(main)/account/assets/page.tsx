"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/constants/colors";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePortfolio, PortfolioHolding } from "@/lib/hooks/usePortfolio";
import { WaitlistPanel } from "@/components/organisms/WaitlistPanel";

type SortColumn = "ticker" | "avg_cost" | "amount" | "current_price" | "total_holdings" | "pnl" | "last_purchase";
type SortOrder = "ASC" | "DESC";

export default function AssetsPage() {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();
  const { holdings, isLoading: portfolioLoading } = usePortfolio();
  const [sortBy, setSortBy] = useState<SortColumn>("ticker");
  const [sortOrder, setSortOrder] = useState<SortOrder>("ASC");

  // Handle column sort
  const handleColumnSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "DESC" ? "ASC" : "DESC");
    } else {
      setSortBy(column);
      setSortOrder("DESC");
    }
  };

  // Get sort indicator
  const getSortIndicator = (column: SortColumn) => {
    if (sortBy !== column) return "";
    return sortOrder === "DESC" ? " ▼" : " ▲";
  };

  // Helper to calculate values
  const getTotalHoldings = (holding: PortfolioHolding) => holding.pvAmount * holding.currentPrice;
  const getPnL = (holding: PortfolioHolding) => {
    const totalCost = holding.pvAmount * holding.avgCostBasis;
    const totalValue = holding.pvAmount * holding.currentPrice;
    return totalValue - totalCost;
  };
  const getPnLPercent = (holding: PortfolioHolding) => {
    const totalCost = holding.pvAmount * holding.avgCostBasis;
    if (totalCost === 0) return 0;
    return ((holding.currentPrice - holding.avgCostBasis) / holding.avgCostBasis) * 100;
  };

  // Sort holdings
  const sortedHoldings = React.useMemo(() => {
    return [...holdings].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortBy) {
        case "ticker":
          aVal = a.ticker;
          bVal = b.ticker;
          return sortOrder === "DESC"
            ? bVal.localeCompare(aVal)
            : aVal.localeCompare(bVal);
        case "avg_cost":
          aVal = a.avgCostBasis;
          bVal = b.avgCostBasis;
          break;
        case "amount":
          aVal = a.pvAmount;
          bVal = b.pvAmount;
          break;
        case "current_price":
          aVal = a.currentPrice;
          bVal = b.currentPrice;
          break;
        case "total_holdings":
          aVal = getTotalHoldings(a);
          bVal = getTotalHoldings(b);
          break;
        case "pnl":
          aVal = getPnL(a);
          bVal = getPnL(b);
          break;
        case "last_purchase":
          aVal = a.lastPurchaseDate ? new Date(a.lastPurchaseDate).getTime() : 0;
          bVal = b.lastPurchaseDate ? new Date(b.lastPurchaseDate).getTime() : 0;
          break;
        default:
          return 0;
      }

      return sortOrder === "DESC" ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
    });
  }, [holdings, sortBy, sortOrder]);

  // Format date
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle row click - navigate to issuer page
  const handleRowClick = (holding: PortfolioHolding) => {
    router.push(`/issuer/${holding.ticker.toLowerCase()}`);
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  // Render portfolio table row
  const renderRow = (holding: PortfolioHolding, index: number) => {
    const rowBg = index % 2 === 0 ? colors.background : colors.box;
    const totalHoldings = getTotalHoldings(holding);
    const pnl = getPnL(holding);
    const pnlPercent = getPnLPercent(holding);
    const isPnlPositive = pnl >= 0;

    return (
      <div
        key={holding.ticker}
        onClick={() => handleRowClick(holding)}
        className="font-mono"
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1.2fr 1fr 1.2fr 1.5fr 1.2fr",
          gap: "12px",
          padding: "10px 20px",
          borderBottom: `1px solid ${colors.boxLight}`,
          cursor: "pointer",
          transition: "background-color 0.2s",
          alignItems: "center",
          backgroundColor: rowBg,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.boxHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = rowBg;
        }}
      >
        {/* Ticker */}
        <div
          style={{
            color: colors.textPrimary,
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          {holding.ticker}
        </div>

        {/* Average Cost */}
        <div
          style={{
            color: colors.textPrimary,
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          ${holding.avgCostBasis.toFixed(2)}
        </div>

        {/* Amount (PV tokens) */}
        <div
          style={{
            color: colors.textPrimary,
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          {holding.pvAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          })}
        </div>

        {/* Current Price */}
        <div
          style={{
            color: colors.textPrimary,
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          ${holding.currentPrice.toFixed(2)}
        </div>

        {/* Total Holdings */}
        <div
          style={{
            color: colors.textPrimary,
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          {formatCurrency(totalHoldings)}
        </div>

        {/* P/L */}
        <div
          style={{
            color: isPnlPositive ? colors.green : colors.red,
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          {isPnlPositive ? "+" : ""}{formatCurrency(pnl)} ({isPnlPositive ? "+" : ""}{pnlPercent.toFixed(1)}%)
        </div>

        {/* Last Purchase Date */}
        <div
          style={{
            color: colors.textSecondary,
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          {formatDate(holding.lastPurchaseDate)}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div
        className="rounded-lg p-6 border"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.boxOutline,
        }}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 rounded" style={{ backgroundColor: colors.boxLight }} />
          <div className="h-20 w-full rounded" style={{ backgroundColor: colors.boxLight }} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="rounded-lg p-6 text-center border"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.boxOutline,
        }}
      >
        <p style={{ color: colors.textSecondary }}>
          Please log in to view your assets.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Waitlist overlay – TODO: Hook up to Supabase waitlist API. See docs/WAITLIST_API.md */}
      <div className="absolute inset-0 z-20 flex items-start justify-center pt-12 px-4">
        <div
          className="w-full max-w-2xl rounded-xl border shadow-2xl"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.boxOutline,
          }}
        >
          <div className="px-6 pt-5 pb-1 text-center">
            <span
              className="font-mono text-lg font-semibold"
              style={{ color: colors.textPrimary }}
            >
              Assets Coming at Launch
            </span>
          </div>
          <WaitlistPanel height={480} expanded />
        </div>
      </div>

      {/* Blurred background content */}
      <div className="pointer-events-none select-none" style={{ filter: "blur(6px)", opacity: 0.4 }}>
      <div className="space-y-6">
      {/* USDP Balance Card */}
      <div
        className="rounded-lg p-6 border"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.boxOutline,
        }}
      >
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: colors.textPrimary }}
        >
          Assets
        </h1>

        {/* Total Value */}
        <div
          className="p-4 rounded-lg mb-6 border"
          style={{
            backgroundColor: colors.boxLight,
            borderColor: colors.boxOutline,
          }}
        >
          <p
            className="text-sm mb-1"
            style={{ color: colors.textSecondary }}
          >
            Total Portfolio Value
          </p>
          <p
            className="text-3xl font-bold"
            style={{ color: colors.textPrimary }}
          >
            ${(
              (profile?.usdp_balance || 0) +
              holdings.reduce((sum, h) => sum + h.pvAmount * h.currentPrice, 0)
            ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* USDP */}
        <div className="space-y-4">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            Balances
          </h2>
          
          <div
            className="flex items-center p-4 rounded-lg border"
            style={{
              backgroundColor: colors.boxLight,
              borderColor: colors.boxOutline,
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
              style={{
                backgroundColor: colors.box,
                color: colors.textPrimary,
              }}
            >
              $
            </div>
            <div className="ml-3">
              <div className="flex items-center gap-3">
                <p
                  className="font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  USDP
                </p>
                <p
                  className="text-lg font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  {profile?.usdp_balance?.toLocaleString() || "0.00"}
                </p>
              </div>
              <p
                className="text-sm"
                style={{ color: colors.textSecondary }}
              >
                Pauv Stable Coin
              </p>
            </div>
          </div>
        </div>

        {/* PV Holdings */}
        <div className="mt-6 space-y-4">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            PV Holdings
          </h2>
          
          {portfolioLoading ? (
            <div
              className="p-8 rounded-lg border text-center"
              style={{
                backgroundColor: colors.boxLight,
                borderColor: colors.boxOutline,
              }}
            >
              <p style={{ color: colors.textSecondary }}>
                Loading portfolio...
              </p>
            </div>
          ) : holdings.length === 0 ? (
            <div
              className="p-8 rounded-lg border text-center"
              style={{
                backgroundColor: colors.boxLight,
                borderColor: colors.boxOutline,
              }}
            >
              <p style={{ color: colors.textSecondary }}>
                You don&apos;t own any PV tokens yet.
              </p>
              <p
                className="text-sm mt-2"
                style={{ color: colors.textMuted }}
              >
                Start trading to build your portfolio.
              </p>
            </div>
          ) : (
            <div
              className="rounded-lg border overflow-hidden"
              style={{
                backgroundColor: colors.background,
                borderColor: colors.boxOutline,
              }}
            >
              {/* Table Header */}
              <div
                className="font-mono"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr 1.2fr 1fr 1.2fr 1.5fr 1.2fr",
                  gap: "12px",
                  padding: "8px 20px",
                  backgroundColor: colors.background,
                  borderBottom: `1px solid ${colors.border}`,
                  fontSize: "11px",
                  color: colors.textPrimary,
                  fontWeight: "600",
                }}
              >
                <div
                  onClick={() => handleColumnSort("ticker")}
                  style={{ cursor: "pointer", userSelect: "none" }}
                >
                  Ticker{getSortIndicator("ticker")}
                </div>
                <div
                  onClick={() => handleColumnSort("avg_cost")}
                  style={{ textAlign: "right", cursor: "pointer", userSelect: "none" }}
                >
                  Avg Cost{getSortIndicator("avg_cost")}
                </div>
                <div
                  onClick={() => handleColumnSort("amount")}
                  style={{ textAlign: "right", cursor: "pointer", userSelect: "none" }}
                >
                  Amount{getSortIndicator("amount")}
                </div>
                <div
                  onClick={() => handleColumnSort("current_price")}
                  style={{ textAlign: "right", cursor: "pointer", userSelect: "none" }}
                >
                  Price{getSortIndicator("current_price")}
                </div>
                <div
                  onClick={() => handleColumnSort("total_holdings")}
                  style={{ textAlign: "right", cursor: "pointer", userSelect: "none" }}
                >
                  Total{getSortIndicator("total_holdings")}
                </div>
                <div
                  onClick={() => handleColumnSort("pnl")}
                  style={{ textAlign: "right", cursor: "pointer", userSelect: "none" }}
                >
                  P/L{getSortIndicator("pnl")}
                </div>
                <div
                  onClick={() => handleColumnSort("last_purchase")}
                  style={{ textAlign: "right", cursor: "pointer", userSelect: "none" }}
                >
                  Last Buy{getSortIndicator("last_purchase")}
                </div>
              </div>

              {/* Table Rows */}
              <div>
                {sortedHoldings.map((holding, index) => renderRow(holding, index))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>{/* end blur wrapper */}
    </div>
  );
}
