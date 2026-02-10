"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";

interface SkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

/**
 * Skeleton - Base skeleton loading component
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  height = "1rem",
  width = "100%",
  rounded = false,
  animate = true,
}) => {
  const animationClasses = animate ? "animate-pulse" : "";
  const roundedClasses = rounded ? "rounded-full" : "rounded";

  return (
    <div
      className={`${animationClasses} ${roundedClasses} ${className}`}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        width: typeof width === "number" ? `${width}px` : width,
        backgroundColor: colors.boxLight,
      }}
    />
  );
};

/**
 * SkeletonText - Multi-line text skeleton
 */
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  lineHeight?: string;
}> = ({ lines = 1, className = "", lineHeight = "1rem" }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 && lines > 1 ? "75%" : "100%"}
        />
      ))}
    </div>
  );
};

/**
 * SkeletonCard - Card container skeleton
 */
export const SkeletonCard: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className = "", children }) => {
  return (
    <div
      className={`rounded-[10px] ${className}`}
      style={{
        backgroundColor: colors.box,
        border: `1px solid ${colors.boxOutline}`,
      }}
    >
      {children}
    </div>
  );
};

/* ==========================================================================
   ISSUER TRADING PAGE — Per-Section Skeletons
   Each one mirrors the exact layout of the real loaded component.
   ========================================================================== */

/**
 * PriceDisplaySkeleton
 * Mirrors: PriceDisplay (back-button row + price box)
 */
export const PriceDisplaySkeleton: React.FC = () => {
  return (
    <div>
      {/* Back button row */}
      <div className="flex items-center justify-between mb-2 px-1">
        <Skeleton width="100px" height="1.5rem" />
      </div>
      {/* Price card */}
      <div
        className="p-4 pb-2 rounded-[10px]"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        <Skeleton width="90px" height="0.7rem" className="mb-2" />
        <Skeleton width="80%" height="1.7rem" />
      </div>
    </div>
  );
};

/**
 * TradingSummarySkeleton
 * Mirrors: TradingSummarySection (section header + 2×2 metrics grid + 3 price changes)
 */
export const TradingSummarySkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      {/* Section header row */}
      <div className="flex items-center justify-between px-1">
        <Skeleton width="155px" height="1.25rem" />
        <Skeleton width="58px" height="1.5rem" />
      </div>

      {/* Metrics card */}
      <div
        className="p-4 rounded-[10px]"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        {/* 2×2 grid — matches the real text-xs label + text-lg value sizing */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <Skeleton width="70%" height="0.75rem" className="mb-1.5" />
              <Skeleton width="60%" height="1.4rem" />
            </div>
          ))}
        </div>

        {/* Price changes row */}
        <div
          className="mt-3 pt-3 flex justify-between"
          style={{ borderTop: `1px solid ${colors.boxOutline}` }}
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center flex flex-col items-center">
              <Skeleton width="24px" height="0.75rem" className="mb-1.5" />
              <Skeleton width="52px" height="1.15rem" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * HoldersSkeleton
 * Mirrors: HoldersSection (header row + table with header row + placeholder rows)
 */
export const HoldersSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      {/* Section header row */}
      <div className="flex items-center justify-between px-1">
        <Skeleton width="120px" height="1.25rem" />
        <Skeleton width="58px" height="1.5rem" />
      </div>

      {/* Table card */}
      <div
        className="p-3 rounded-[10px] overflow-hidden"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        <table className="min-w-full table-fixed">
          <thead>
            <tr>
              <th className="text-left px-3 py-2">
                <Skeleton width="32px" height="0.75rem" />
              </th>
              <th className="text-right px-3 py-2">
                <Skeleton width="52px" height="0.75rem" className="ml-auto" />
              </th>
              <th className="text-right px-3 py-2">
                <Skeleton width="40px" height="0.75rem" className="ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr
                key={i}
                style={{
                  backgroundColor: i % 2 === 0 ? "transparent" : colors.boxLight,
                }}
              >
                <td className="px-2 py-2">
                  <Skeleton width="70%" height="0.75rem" />
                </td>
                <td className="px-3 py-2">
                  <Skeleton width="50%" height="0.75rem" className="ml-auto" />
                </td>
                <td className="px-3 py-2">
                  <Skeleton width="40%" height="0.75rem" className="ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * IssuerHeaderSkeleton (formerly IssuerDetailsSkeleton)
 * Mirrors: IssuerHeader (avatar + name/headline + tag + bio lines)
 */
export const IssuerHeaderSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center w-full justify-between gap-3">
        {/* Avatar */}
        <Skeleton width={80} height={80} rounded />
        {/* Name + headline */}
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton height="2rem" width="65%" />
          <Skeleton height="0.85rem" width="40%" />
        </div>
        {/* Tag pill */}
        <Skeleton width={72} height={26} className="rounded-full flex-shrink-0" />
      </div>
      {/* Bio lines */}
      <div className="pl-1 mt-3 space-y-2">
        <Skeleton height="0.85rem" width="100%" />
        <Skeleton height="0.85rem" width="92%" />
        <Skeleton height="0.85rem" width="60%" />
      </div>
    </div>
  );
};

/** Keep legacy alias */
export const IssuerDetailsSkeleton = IssuerHeaderSkeleton;

/**
 * ChartSkeleton
 * Mirrors: PriceChart (header bar with price + range buttons, then chart area)
 */
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 420 }) => {
  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: colors.boxOutline }}
      >
        {/* Price + change placeholder */}
        <div className="flex items-center gap-2">
          <Skeleton width="110px" height="1.25rem" />
          <Skeleton width="52px" height="0.85rem" />
        </div>
        {/* Range buttons */}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} width="38px" height="26px" />
          ))}
        </div>
      </div>
      {/* Chart area */}
      <div style={{ height }} className="relative">
        {/* Subtle grid lines to hint at the chart */}
        <div className="absolute inset-0 flex flex-col justify-between py-6 px-4 opacity-20">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                height: "1px",
                backgroundColor: colors.boxOutline,
              }}
            />
          ))}
        </div>
        {/* Fake line chart shimmer */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton width="90%" height="60%" className="opacity-30" />
        </div>
      </div>
    </div>
  );
};

/**
 * TradingFormSkeleton
 * Mirrors: TradingFormSimple (header + buy/sell toggle + input + balance rows)
 */
export const TradingFormSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between px-1">
        <Skeleton width="110px" height="1.25rem" />
      </div>

      {/* Buy/Sell toggle */}
      <div className="flex gap-1">
        <div
          className="flex-1 py-2 rounded-md"
          style={{
            border: `1px solid ${colors.boxOutline}`,
            backgroundColor: "transparent",
          }}
        >
          <Skeleton width="36px" height="1rem" className="mx-auto" />
        </div>
        <div
          className="flex-1 py-2 rounded-md"
          style={{
            border: `1px solid ${colors.boxOutline}`,
            backgroundColor: "transparent",
          }}
        >
          <Skeleton width="32px" height="1rem" className="mx-auto" />
        </div>
      </div>

      {/* Amount input placeholder */}
      <div
        className="w-full px-4 py-3 rounded-md"
        style={{
          backgroundColor: colors.background,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        <Skeleton width="110px" height="0.85rem" />
      </div>

      {/* Balance rows */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <Skeleton width="90px" height="0.8rem" />
          <Skeleton width="70px" height="0.8rem" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton width="130px" height="0.8rem" />
          <Skeleton width="60px" height="0.8rem" />
        </div>
      </div>
    </div>
  );
};

/**
 * UserHoldingsSkeleton
 * Mirrors: UserHoldings (header + 3 transaction rows)
 */
export const UserHoldingsSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <Skeleton width="170px" height="1.25rem" />
        <Skeleton width="58px" height="1.5rem" />
      </div>

      <div
        className="px-4 py-2 rounded-[10px]"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="py-2 grid items-center justify-center grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)]"
            style={{
              borderBottom: i === 3 ? "none" : `1px solid ${colors.boxOutline}`,
            }}
          >
            <Skeleton width="48px" height="1.4rem" className="justify-self-center rounded" />
            <Skeleton width="60%" height="0.85rem" className="mx-auto" />
            <Skeleton width="55%" height="0.85rem" className="mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * RecommendedIssuersSkeleton
 * Mirrors: RecommendedIssuers (title + refresh + 3 issuer card rows)
 */
export const RecommendedIssuersSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <Skeleton width="190px" height="1.25rem" />
        <Skeleton width="58px" height="1.5rem" />
      </div>

      <div
        className="rounded-[10px] overflow-hidden"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3"
            style={{
              borderBottom: i === 3 ? "none" : `1px solid ${colors.boxOutline}`,
            }}
          >
            {/* Issuer avatar */}
            <Skeleton width={48} height={48} rounded />
            {/* Info */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <Skeleton width="40%" height="0.7rem" />
              <Skeleton width="65%" height="0.9rem" />
            </div>
            {/* Price area */}
            <div className="flex-shrink-0 text-right space-y-1.5">
              <Skeleton width="60px" height="0.85rem" className="ml-auto" />
              <Skeleton width="44px" height="0.7rem" className="ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * FullPageSkeleton
 * Renders the exact 3-column trading layout with individual section skeletons.
 * Kept for backwards-compatibility but now uses per-section skeletons.
 */
export const FullPageSkeleton: React.FC = () => {
  return (
    <div
      className="min-h-screen pt-4 pb-16"
      style={{ backgroundColor: colors.background }}
    >
      <div className="flex gap-6 px-4">
        {/* Left Sidebar */}
        <aside className="hidden lg:block lg:w-80 lg:flex-shrink-0 space-y-4">
          <PriceDisplaySkeleton />
          <TradingSummarySkeleton />
          <HoldersSkeleton />
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-4">
          <IssuerHeaderSkeleton />
          <ChartSkeleton height={420} />
        </div>

        {/* Right Sidebar */}
        <aside className="hidden lg:block lg:w-80 lg:flex-shrink-0">
          <TradingFormSkeleton />
          <UserHoldingsSkeleton />
          <RecommendedIssuersSkeleton />
        </aside>
      </div>
    </div>
  );
};

/* ==========================================================================
   LISTING PAGES — Tag & Home skeletons (kept unchanged)
   ========================================================================== */

/**
 * TagPageSkeleton - Full page skeleton for the tag listing page
 */
export const TagPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.backgroundDark }}>
      <div style={{ maxWidth: "1250px", margin: "0 auto", width: "100%" }}>
        {/* Hero - tag selected: single full-width banner */}
        <div style={{ margin: "20px", marginBottom: "8px" }}>
          <div
            style={{
              position: "relative",
              background: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: "10px",
              minHeight: "177px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              padding: "20px",
            }}
          >
            {/* Back button placeholder */}
            <div style={{ position: "absolute", top: "8px", left: "10px" }}>
              <Skeleton width="100px" height="16px" />
            </div>
            {/* Tag info */}
            <div style={{ flex: 1 }}>
              <Skeleton width="220px" height="28px" className="mb-2" />
              <Skeleton width="60%" height="16px" className="mb-2" />
              <Skeleton width="100px" height="14px" />
            </div>
          </div>
        </div>

        {/* Tags + Content */}
        <div className="px-4 md:px-5 mb-5">
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            {/* Tag sidebar */}
            <div className="hidden lg:block" style={{ width: "220px", maxWidth: "220px" }}>
              <div
                style={{
                  backgroundColor: colors.box,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "10px",
                  padding: "12px 8px",
                }}
              >
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "8px 11px",
                      borderBottom:
                        index === 5 ? "none" : `1px solid ${colors.border}`,
                    }}
                  >
                    <Skeleton width="70%" height="16px" className="mb-1.5" />
                    <div className="flex justify-between items-center">
                      <Skeleton width="45%" height="12px" />
                      <Skeleton width="35%" height="14px" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flex: "1", minWidth: "0" }}>
              {/* Navigation bar skeleton */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    borderRadius: "6px",
                    padding: "3px 7px",
                  }}
                >
                  <Skeleton width="52px" height="26px" className="hidden md:block" />
                  <Skeleton width="160px" height="26px" className="hidden md:block" />
                  <Skeleton width="50px" height="26px" className="hidden md:block" />
                  <Skeleton width="90px" height="26px" />
                  <Skeleton width="66px" height="26px" />
                  <Skeleton width="62px" height="26px" />
                  <Skeleton width="86px" height="26px" />
                </div>
              </div>

              {/* Issuer cards grid */}
              <div className="mt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: colors.background,
                        height: "112px",
                        padding: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <Skeleton width="88px" height="88px" />
                      <div className="flex-1" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "2px" }}>
                        <Skeleton width="40%" height="14px" />
                        <Skeleton width="70%" height="16px" />
                        <Skeleton width="30%" height="11px" />
                        <div className="flex justify-between items-end" style={{ marginTop: "4px" }}>
                          <Skeleton width="45%" height="16px" />
                          <Skeleton width="30%" height="13px" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * HomePageSkeleton - Full page skeleton for the home listing page
 */
export const HomePageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.backgroundDark }}>
      <div style={{ maxWidth: "1250px", margin: "0 auto", width: "100%" }}>
        {/* Hero - single box (no market cap box) */}
        <div style={{ display: "flex", gap: "10px", margin: "20px", marginBottom: "8px" }}>
          <div
            style={{
              flex: "3",
              background: colors.box,
              border: `1px solid ${colors.border}`,
              borderRadius: "10px",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: "20px",
              minHeight: "177px",
            }}
          >
            {/* Logo placeholder (150×50 matches Logo height={50} with 3:1 aspect ratio) */}
            <Skeleton width="150px" height="50px" />
            <div className="space-y-2">
              <Skeleton width="180px" height="20px" />
              <Skeleton width="100px" height="14px" />
            </div>
          </div>
        </div>

        {/* Tags + Content */}
        <div className="px-4 md:px-5 mb-5">
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            {/* Tag sidebar */}
            <div className="hidden lg:block" style={{ width: "220px", maxWidth: "220px" }}>
              <div
                style={{
                  backgroundColor: colors.box,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "10px",
                  padding: "12px 8px",
                }}
              >
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "8px 11px",
                      borderBottom:
                        index === 5 ? "none" : `1px solid ${colors.border}`,
                    }}
                  >
                    <Skeleton width="70%" height="16px" className="mb-1.5" />
                    <div className="flex justify-between items-center">
                      <Skeleton width="45%" height="12px" />
                      <Skeleton width="35%" height="14px" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flex: "1", minWidth: "0" }}>
              {/* Navigation bar skeleton */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    borderRadius: "6px",
                    padding: "3px 7px",
                  }}
                >
                  <Skeleton width="52px" height="26px" className="hidden md:block" />
                  <Skeleton width="160px" height="26px" className="hidden md:block" />
                  <Skeleton width="50px" height="26px" className="hidden md:block" />
                  <Skeleton width="90px" height="26px" />
                  <Skeleton width="66px" height="26px" />
                  <Skeleton width="62px" height="26px" />
                  <Skeleton width="86px" height="26px" />
                </div>
              </div>

              {/* Issuer cards grid */}
              <div className="mt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: colors.background,
                        height: "112px",
                        padding: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <Skeleton width="88px" height="88px" />
                      <div className="flex-1" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "2px" }}>
                        <Skeleton width="40%" height="14px" />
                        <Skeleton width="70%" height="16px" />
                        <Skeleton width="30%" height="11px" />
                        <div className="flex justify-between items-end" style={{ marginTop: "4px" }}>
                          <Skeleton width="45%" height="16px" />
                          <Skeleton width="30%" height="13px" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * WalletDepositsWithdrawalsSkeleton - Skeleton for the deposits/withdrawals section
 */
export const WalletDepositsWithdrawalsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton height="2rem" width="16rem" className="mb-2" />
          <Skeleton height="1rem" width="12rem" />
        </div>
        <Skeleton height="2.5rem" width="6rem" rounded />
      </div>
      <div className="rounded-lg p-6" style={{ backgroundColor: colors.box, border: `1px solid ${colors.boxOutline}` }}>
        <Skeleton height="0.75rem" width="6rem" className="mb-2" />
        <Skeleton height="2.5rem" width="10rem" />
      </div>
      <div className="rounded-lg p-6" style={{ backgroundColor: colors.box, border: `1px solid ${colors.boxOutline}` }}>
        <Skeleton height="1.25rem" width="8rem" className="mb-4" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton height="2.5rem" width="50%" rounded />
              <Skeleton height="2.5rem" width="50%" rounded />
            </div>
            <Skeleton height="2.5rem" width="100%" rounded />
            <Skeleton height="2.5rem" width="100%" rounded />
          </div>
        </div>
      </div>
      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: colors.box, border: `1px solid ${colors.boxOutline}` }}>
        <div className="p-6" style={{ borderBottom: `1px solid ${colors.boxOutline}` }}>
          <Skeleton height="1.25rem" width="10rem" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton height="1rem" width="6rem" />
              <Skeleton height="1.5rem" width="4rem" rounded />
              <Skeleton height="1rem" width="5rem" />
              <Skeleton height="1rem" width="5rem" />
              <Skeleton height="1.5rem" width="1.5rem" rounded />
              <Skeleton height="1rem" width="8rem" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
