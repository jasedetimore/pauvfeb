"use client";

import React, { useState, useRef, useEffect } from "react";
import { colors } from "@/lib/constants/colors";

interface IssuerHeaderProps {
  ticker: string;
  name: string;
  imageUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  tags?: string[];
  isLoading?: boolean;
}

/**
 * IssuerHeader - Displays the issuer's profile header with image, name, and bio
 * Used at the top of the trading page
 */
export const IssuerHeader: React.FC<IssuerHeaderProps> = ({
  ticker,
  name,
  imageUrl,
  headline,
  bio,
  tags,
  isLoading = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if bio needs "See More" button
  useEffect(() => {
    const timer = setTimeout(() => {
      if (contentRef.current && bio) {
        const isOverflowing =
          contentRef.current.scrollHeight > contentRef.current.clientHeight;
        setShowSeeMore(isOverflowing);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [bio]);

  // Get fallback initial from name
  const getInitial = () => {
    return (name?.charAt(0) || ticker?.charAt(0) || "?").toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-full flex-shrink-0"
            style={{ backgroundColor: colors.boxLight }}
          />
          <div className="flex-1 space-y-2">
            <div
              className="h-8 rounded w-3/4"
              style={{ backgroundColor: colors.boxLight }}
            />
            <div
              className="h-4 rounded w-1/2"
              style={{ backgroundColor: colors.boxLight }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center w-full justify-between gap-3">
        {/* Profile Image */}
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={`${name} logo`}
            className="w-20 h-20 rounded-full object-cover flex-shrink-0"
            onError={() => setImageError(true)}
          />
        ) : (
          <span
            className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-medium flex-shrink-0"
            style={{
              backgroundColor: colors.boxLight,
              border: `1px solid ${colors.boxOutline}`,
              color: colors.textPrimary,
            }}
          >
            {getInitial()}
          </span>
        )}

        {/* Name and Headline */}
        <div className="flex-1 min-w-0">
          <h1
            className="font-mono font-bold truncate text-[2rem] md:text-[2.2rem] leading-none"
            style={{ color: colors.textPrimary }}
          >
            {name || ticker}
          </h1>
          {headline && (
            <div
              className="text-sm font-light mt-1"
              style={{ color: colors.textSecondary }}
            >
              {headline}
            </div>
          )}
        </div>

        {/* Tag aligned with name */}
        {tags && tags.length > 0 && (
          <div className="flex-shrink-0">
            <span
              className="px-3 py-1 rounded-full text-xs font-medium uppercase"
              style={{
                backgroundColor: `${colors.gold}20`,
                color: colors.gold,
                border: `1px solid ${colors.gold}40`,
              }}
            >
              {tags[0]}
            </span>
          </div>
        )}
      </div>

      {/* Bio Section */}
      {bio && (
        <>
          <div
            ref={contentRef}
            className={`pl-1 mt-3 ${!isExpanded ? "line-clamp-3" : ""}`}
          >
            <p
              className="text-sm leading-relaxed"
              style={{ color: colors.textSecondary }}
            >
              {bio}
            </p>
          </div>

          {showSeeMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full text-sm font-normal underline cursor-pointer transition-colors mt-1 text-left"
              style={{ color: colors.textPrimary }}
            >
              {isExpanded ? "Show Less" : "See More"}
            </button>
          )}
        </>
      )}
    </div>
  );
};
