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
  const baseClasses = "bg-white/10";
  const animationClasses = animate ? "animate-pulse" : "";
  const roundedClasses = rounded ? "rounded-full" : "rounded";

  return (
    <div
      className={`${baseClasses} ${animationClasses} ${roundedClasses} ${className}`}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        width: typeof width === "number" ? `${width}px` : width,
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
      className={`rounded-lg ${className}`}
      style={{
        backgroundColor: colors.box,
        border: `1px solid ${colors.boxOutline}`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * IssuerDetailsSkeleton - Skeleton for issuer details header
 */
export const IssuerDetailsSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Header with image and name */}
      <div className="flex items-center gap-4">
        <Skeleton width={80} height={80} rounded />
        <div className="space-y-2 flex-1">
          <Skeleton height="2rem" width="60%" />
          <Skeleton height="1rem" width="40%" />
        </div>
      </div>
      {/* Bio/description */}
      <SkeletonText lines={3} />
    </div>
  );
};

/**
 * PriceDisplaySkeleton - Skeleton for price display
 */
export const PriceDisplaySkeleton: React.FC = () => {
  return (
    <SkeletonCard className="p-4">
      <Skeleton width="100px" height="0.75rem" className="mb-2" />
      <Skeleton width="70%" height="2rem" className="mb-2" />
      <Skeleton width="120px" height="0.75rem" />
    </SkeletonCard>
  );
};

/**
 * TradingFormSkeleton - Skeleton for trading form
 */
export const TradingFormSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <Skeleton width="120px" height="1.5rem" className="mb-2" />
      <div className="space-y-3">
        <Skeleton width="80px" height="0.75rem" />
        <Skeleton width="100%" height="48px" />
      </div>
      <div className="flex gap-3">
        <Skeleton width="50%" height="48px" />
        <Skeleton width="50%" height="48px" />
      </div>
    </div>
  );
};

/**
 * ChartSkeleton - Skeleton for chart display
 */
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => {
  return (
    <SkeletonCard className="p-4">
      {/* Time range buttons */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} width="40px" height="28px" />
        ))}
      </div>
      {/* Chart area */}
      <Skeleton width="100%" height={height} />
    </SkeletonCard>
  );
};

/**
 * TradingSummarySkeleton - Skeleton for trading summary metrics
 */
export const TradingSummarySkeleton: React.FC = () => {
  return (
    <SkeletonCard className="p-4">
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton width="60%" height="0.75rem" />
            <Skeleton width="80%" height="1.25rem" />
          </div>
        ))}
      </div>
    </SkeletonCard>
  );
};

/**
 * HoldersSkeleton - Skeleton for holders table
 */
export const HoldersSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <SkeletonCard className="p-4">
      <Skeleton width="120px" height="1.25rem" className="mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton width="40%" height="1rem" />
            <Skeleton width="20%" height="1rem" />
            <Skeleton width="15%" height="1rem" />
          </div>
        ))}
      </div>
    </SkeletonCard>
  );
};

/**
 * FullPageSkeleton - Full page skeleton for trading page
 */
export const FullPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: colors.background }}>
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        <Skeleton width="80px" height="32px" className="mb-4" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sidebar */}
          <div className="lg:col-span-3 space-y-4">
            <PriceDisplaySkeleton />
            <TradingSummarySkeleton />
          </div>

          {/* Main content */}
          <div className="lg:col-span-6 space-y-4">
            <IssuerDetailsSkeleton />
            <ChartSkeleton height={350} />
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-3 space-y-4">
            <TradingFormSkeleton />
            <HoldersSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
};
