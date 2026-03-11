"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { colors } from "@/lib/constants/colors";
import { IssuerHeaderSkeleton, SocialMediaLinks } from "@/components/atoms";
import { IssuerLinksDB } from "@/lib/types/issuer-links";
import { EXAMPLE_ISSUER_TICKERS } from "@/lib/constants";

import { AutoTextSize } from "auto-text-size";
import { useIsMobile } from "@/lib/hooks/useIsMobile";

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const mobileContainer = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: EASE_OUT,
      staggerChildren: 0.07,
      delayChildren: 0.3,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

interface IssuerHeaderProps {
  ticker: string;
  name: string;
  imageUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  tags?: string[];
  issuerLinks?: IssuerLinksDB | null;
  isLoading?: boolean;
  /** Skip the useIsMobile hook and force mobile rendering (avoids hydration flash) */
  forceMobile?: boolean;
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
  forceMobile,
}) => {
  const [imageError, setImageError] = useState(false);
  const isMobileHook = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use the hook if mounted, otherwise assume desktop for SSR
  // forceMobile bypasses the hook entirely (used when rendered inside lg:hidden)
  const isMobile = forceMobile ?? (mounted ? isMobileHook : false);

  // Get fallback initial from name
  const getInitial = () => {
    return (name?.charAt(0) || ticker?.charAt(0) || "?").toUpperCase();
  };

  const isExample = EXAMPLE_ISSUER_TICKERS.has(ticker);

  if (isLoading) {
    return <IssuerHeaderSkeleton />;
  }

  // On mobile, use animated wrapper; on desktop, plain div
  const Wrapper = isMobile ? motion.div : "div";
  const Section = isMobile ? motion.div : "div";

  const wrapperProps = isMobile
    ? { variants: mobileContainer, initial: "hidden", animate: "show" }
    : {};
  const sectionProps = isMobile ? { variants: fadeUp } : {};

  return (
    <Wrapper className="flex flex-col min-w-0" {...wrapperProps}>
      <Section className="flex items-center w-full justify-between gap-3" {...sectionProps}>
        {/* Profile Image */}
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={`${name} logo`}
            width={112}
            height={112}
            className="w-28 h-28 md:w-[90px] md:h-[90px] rounded-full object-cover flex-shrink-0"
            onError={() => setImageError(true)}
          />
        ) : (
          <span
            className="w-28 h-28 md:w-[90px] md:h-[90px] rounded-full flex items-center justify-center text-3xl md:text-2xl font-medium flex-shrink-0"
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
            <h1
              className="font-mono font-bold text-[2rem] leading-tight break-words"
              style={{ color: colors.textPrimary }}
            >
              {name || ticker}
            </h1>
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
                  (example talent)
                </span>
              )}
            </div>
          )}

          {headline && (
            <div
              className="text-lg md:text-lg font-light mt-1 break-words"
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
      </Section>

      {/* Bio Section */}
      {bio && (
        <Section className="pl-1 mt-3" {...sectionProps}>
          <p
            className="text-sm leading-relaxed"
            style={{ color: colors.textSecondary }}
          >
            {bio}
          </p>
        </Section>
      )}

      {/* Social Media Links - right under the bio */}
      <SocialMediaLinks links={issuerLinks ?? null} className="mt-3" animate={isMobile} />
    </Wrapper>
  );
};
