"use client";

import React, { useState } from "react";
import { colors } from "@/lib/constants/colors";
import { IssuerListData } from "@/lib/types";

type SortColumn =
  | "current_price"
  | "price_1h_change"
  | "price_24h_change"
  | "price_7d_change"
  | "trading_volume_24h"
  | "number_of_holders"
  | "total_value_usdp";

type SortOrder = "ASC" | "DESC";

interface IssuerListViewProps {
  issuers: IssuerListData[];
  isLoading?: boolean;
  onIssuerClick?: (issuer: IssuerListData) => void;
  showSubTag?: boolean;
  subTagLabel?: string;
}

/**
 * IssuerListView - Table/list view of issuers with sortable columns
 * Shows detailed information including price changes, volume, holders, and market cap
 */
export function IssuerListView({
  issuers,
  isLoading = false,
  onIssuerClick,
  showSubTag = false,
  subTagLabel = "Tag",
}: IssuerListViewProps) {
  const [sortBy, setSortBy] = useState<SortColumn>("current_price");
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC");

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (str: string): string => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Handle column sort with three states: DESC -> ASC -> Default (price DESC)
  const handleColumnSort = (column: SortColumn) => {
    if (sortBy === column) {
      if (sortOrder === "DESC") {
        setSortOrder("ASC");
      } else {
        // Return to default
        setSortBy("current_price");
        setSortOrder("DESC");
      }
    } else {
      setSortBy(column);
      setSortOrder("DESC");
    }
  };

  // Sort issuers based on current sort state
  const sortedIssuers = React.useMemo(() => {
    return [...issuers].sort((a, b) => {
      let aVal: number = 0;
      let bVal: number = 0;

      switch (sortBy) {
        case "current_price":
          aVal = a.currentPrice;
          bVal = b.currentPrice;
          break;
        case "price_1h_change":
          aVal = a.price1hChange || 0;
          bVal = b.price1hChange || 0;
          break;
        case "price_24h_change":
          aVal = a.price24hChange;
          bVal = b.price24hChange;
          break;
        case "price_7d_change":
          aVal = a.price7dChange || 0;
          bVal = b.price7dChange || 0;
          break;
        case "trading_volume_24h":
          aVal = a.volume24h || 0;
          bVal = b.volume24h || 0;
          break;
        case "number_of_holders":
          aVal = a.holders || 0;
          bVal = b.holders || 0;
          break;
        case "total_value_usdp":
          aVal = a.marketCap || 0;
          bVal = b.marketCap || 0;
          break;
      }

      return sortOrder === "DESC" ? bVal - aVal : aVal - bVal;
    });
  }, [issuers, sortBy, sortOrder]);

  // Format market cap / volume
  const formatValue = (value: number): string => {
    if (!isFinite(value)) return "—";
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Get sort indicator
  const getSortIndicator = (column: SortColumn) => {
    if (sortBy !== column) return "";
    return sortOrder === "DESC" ? " ▼" : " ▲";
  };

  // Render a single row
  const renderRow = (issuer: IssuerListData, index: number) => {
    const rowBg = index % 2 === 0 ? colors.background : colors.box;

    return (
      <div
        key={issuer.ticker}
        onClick={() => onIssuerClick?.(issuer)}
        className="font-mono"
        style={{
          display: "grid",
          gridTemplateColumns: "70px 8fr 100px 75px 50px 50px 35px 60px 50px 75px",
          gap: "16px",
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
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {issuer.ticker}
        </div>

        {/* Full Name */}
        <div
          style={{
            color: colors.textPrimary,
            fontSize: "12px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {issuer.fullName}
        </div>

        {/* Tag */}
        <div
          style={{
            color: colors.textPrimary,
            fontSize: "11px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {issuer.primaryTag ? capitalizeFirstLetter(issuer.primaryTag) : "—"}
        </div>

        {issuer.isTradable === false ? (
          /* Non-tradable: single "Launching soon..." spanning all stat columns */
          <div
            style={{
              gridColumn: "4 / -1",
              color: colors.textPrimary,
              fontSize: "12px",
              fontStyle: "italic",
              textAlign: "center",
              lineHeight: "1",
            }}
          >
            Launching soon...
          </div>
        ) : (
          <>
            {/* Price */}
            <div
              style={{
                color: colors.textPrimary,
                fontSize: "12px",
                textAlign: "right",
              }}
            >
              ${issuer.currentPrice.toFixed(2)}
            </div>

            {/* 1h Change */}
            <div
              style={{
                color: (issuer.price1hChange || 0) >= 0 ? colors.green : colors.red,
                fontSize: "12px",
                textAlign: "right",
              }}
            >
              {(issuer.price1hChange || 0) >= 0 ? "+" : ""}
              {(issuer.price1hChange || 0).toFixed(1)}%
            </div>

            {/* 24h Change */}
            <div
              style={{
                color: issuer.price24hChange >= 0 ? colors.green : colors.red,
                fontSize: "12px",
                textAlign: "right",
              }}
            >
              {issuer.price24hChange >= 0 ? "+" : ""}
              {issuer.price24hChange.toFixed(1)}%
            </div>

            {/* 7d Change */}
            <div
              style={{
                color: (issuer.price7dChange || 0) >= 0 ? colors.green : colors.red,
                fontSize: "12px",
                textAlign: "right",
              }}
            >
              {(issuer.price7dChange || 0) >= 0 ? "+" : ""}
              {(issuer.price7dChange || 0).toFixed(1)}%
            </div>

            {/* Volume */}
            <div
              style={{
                color: colors.textPrimary,
                fontSize: "12px",
                textAlign: "right",
              }}
            >
              {formatValue(issuer.volume24h || 0)}
            </div>

            {/* Holders */}
            <div
              style={{
                color: colors.textPrimary,
                fontSize: "12px",
                textAlign: "right",
              }}
            >
              {(issuer.holders || 0).toLocaleString()}
            </div>

            {/* Market Cap */}
            <div
              style={{
                color: colors.textPrimary,
                fontSize: "12px",
                textAlign: "right",
              }}
            >
              {formatValue(issuer.marketCap || 0)}
            </div>
          </>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div
        style={{
          color: colors.textMuted,
          fontSize: "14px",
          textAlign: "center",
          padding: "40px 20px",
        }}
      >
        Loading...
      </div>
    );
  }

  if (issuers.length === 0) {
    return (
      <div
        style={{
          color: colors.textMuted,
          fontSize: "14px",
          textAlign: "center",
          padding: "40px 20px",
        }}
      >
        No issuers found
      </div>
    );
  }

  return (
    <div
      className="font-mono"
      style={{
        backgroundColor: colors.background,
        overflow: "hidden",
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "70px 8fr 100px 75px 50px 50px 35px 60px 50px 75px",
          gap: "16px",
          padding: "8px 20px",
          backgroundColor: colors.background,
          borderBottom: `1px solid ${colors.border}`,
          fontSize: "11px",
          color: colors.textPrimary,
          fontWeight: "600",
        }}
      >
        <div>Ticker</div>
        <div>Full Name</div>
        <div>{showSubTag ? "Sub Tag" : subTagLabel}</div>

        <div
          onClick={() => handleColumnSort("current_price")}
          style={{ textAlign: "right", cursor: "pointer", userSelect: "none" }}
        >
          Price{getSortIndicator("current_price")}
        </div>

        <div
          onClick={() => handleColumnSort("price_1h_change")}
          style={{ textAlign: "right", cursor: "pointer", userSelect: "none" }}
        >
          1hr{getSortIndicator("price_1h_change")}
        </div>

        <div
          onClick={() => handleColumnSort("price_24h_change")}
          style={{ textAlign: "right", cursor: "pointer", userSelect: "none" }}
        >
          24hr{getSortIndicator("price_24h_change")}
        </div>

        <div
          onClick={() => handleColumnSort("price_7d_change")}
          style={{ textAlign: "right", cursor: "pointer", userSelect: "none" }}
        >
          7d{getSortIndicator("price_7d_change")}
        </div>

        <div
          onClick={() => handleColumnSort("trading_volume_24h")}
          style={{ textAlign: "right", cursor: "pointer", userSelect: "none" }}
        >
          Volume{getSortIndicator("trading_volume_24h")}
        </div>

        <div
          onClick={() => handleColumnSort("number_of_holders")}
          style={{ textAlign: "right", cursor: "pointer", userSelect: "none" }}
        >
          Holders{getSortIndicator("number_of_holders")}
        </div>

        <div
          onClick={() => handleColumnSort("total_value_usdp")}
          style={{ textAlign: "right", cursor: "pointer", userSelect: "none" }}
        >
          Mkt Cap{getSortIndicator("total_value_usdp")}
        </div>
      </div>

      {/* Data Rows */}
      <div>{sortedIssuers.map((issuer, index) => renderRow(issuer, index))}</div>
    </div>
  );
}
