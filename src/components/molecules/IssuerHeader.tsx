"use client";

import React, { useState, useEffect } from "react";
import { colors } from "@/lib/constants/colors";
import { IssuerHeaderSkeleton, SocialMediaLinks } from "@/components/atoms";
import { IssuerLinksDB } from "@/lib/types/issuer-links";
import { EXAMPLE_ISSUER_TICKERS } from "@/lib/constants";

import { AutoTextSize } from "auto-text-size";
import { useIsMobile } from "@/lib/hooks/useIsMobile";

interface IssuerHeaderProps {
  ticker: string;
  name: string;
  imageUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  tags?: string[];
  issuerLinks?: IssuerLinksDB | null;
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
  issuerLinks,
  isLoading = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const isMobileHook = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use the hook if mounted, otherwise assume desktop for SSR
  const isMobile = mounted ? isMobileHook : false;

  // Get fallback initial from name
  const getInitial = () => {
    return (name?.charAt(0) || ticker?.charAt(0) || "?").toUpperCase();
  };

  const isExample = EXAMPLE_ISSUER_TICKERS.has(ticker);

  if (isLoading) {
    return <IssuerHeaderSkeleton />;
  }

  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center w-full justify-between gap-3">
        {/* Profile Image */}
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={`${name} logo`}
            className="w-16 h-16 md:w-[90px] md:h-[90px] rounded-full object-cover flex-shrink-0"
            onError={() => setImageError(true)}
          />
        ) : (
          <span
            className="w-16 h-16 md:w-[90px] md:h-[90px] rounded-full flex items-center justify-center text-lg md:text-2xl font-medium flex-shrink-0"
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
          {isMobile ? (
            <div className="w-full overflow-hidden">
              <AutoTextSize
                mode="oneline"
                maxFontSizePx={35}
                minFontSizePx={24}
                className="font-mono font-bold leading-none w-full whitespace-nowrap"
                style={{ color: colors.textPrimary, paddingBottom: "4px" }}
              >
                {name || ticker}
              </AutoTextSize>
            </div>
          ) : (
            <div className="flex items-baseline gap-3">
              <h1
                className="font-mono font-bold truncate text-[3rem] leading-none text-white"
                style={{ color: colors.textPrimary }}
                title={name || ticker}
              >
                {name || ticker}
              </h1>
              {isExample && (
                <span
                  className="text-sm font-light flex-shrink-0"
                  style={{ color: colors.textMuted }}
                >
                  (example issuer)
                </span>
              )}
            </div>
          )}

          {headline && (
            <div
              className="text-base md:text-lg font-light mt-1"
              style={{ color: colors.textSecondary }}
            >
              {headline}
            </div>
          )}
        </div>

        {/* Tag aligned with name - Only on desktop */}
        {!isMobile && tags && tags.length > 0 && (
          <div className="flex-shrink-0">
            <a
              href={`/${tags[0].toLowerCase()}`}
              className="px-3 py-1 rounded-full text-xs font-medium uppercase inline-block cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: "#FFFFFF",
                color: "#000000",
                border: `1px solid ${colors.boxOutline}`,
              }}
            >
              {tags[0]}
            </a>
          </div>
        )}
      </div>

      {/* Bio Section */}
      {bio && (
        <div className="pl-1 mt-3">
          <p
            className="text-sm leading-relaxed"
            style={{ color: colors.textSecondary }}
          >
            {bio}
          </p>
        </div>
      )}

      {/* Social Media Links - right under the bio */}
      <SocialMediaLinks links={issuerLinks ?? null} className="mt-3" />
    </div>
  );
};
