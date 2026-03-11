"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { colors } from "@/lib/constants/colors";
import { IssuerLinksDB, SocialPlatform } from "@/lib/types/issuer-links";

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Map each platform to its PNG logo in /public */
const PLATFORM_LOGO: Record<SocialPlatform, string> = {
  instagram: "/instagram.png",
  tiktok: "/tiktok.png",
  youtube: "/youtube.png",
  linkedin: "/linkedin.png",
  x: "/x.png",
  threads: "/threads.png",
  facebook: "/facebook.png",
  telegram: "/telegram.png",
  reddit: "/reddit.png",
  twitch: "/twitch.png",
  linktree: "/linktree.png",
};

/** Display-friendly label for each platform */
const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  x: "X",
  threads: "Threads",
  facebook: "Facebook",
  telegram: "Telegram",
  reddit: "Reddit",
  twitch: "Twitch",
  linktree: "Linktree",
};

/** Ordered list of platforms (display order) */
const PLATFORM_ORDER: SocialPlatform[] = [
  "instagram",
  "tiktok",
  "youtube",
  "x",
  "threads",
  "facebook",
  "linkedin",
  "telegram",
  "reddit",
  "twitch",
  "linktree",
];

interface SocialMediaLinksProps {
  links: IssuerLinksDB | null;
  className?: string;
  animate?: boolean;
}

/**
 * SocialMediaLinks - Displays social media platform logos in a compact box.
 * Black background, light grey outline, rounded corners.
 * Each logo is clickable and opens the corresponding social link.
 */
export const SocialMediaLinks: React.FC<SocialMediaLinksProps> = ({
  links,
  className = "",
  animate = false,
}) => {
  if (!links) return null;

  // Collect platforms that have a non-null, non-empty URL
  const activePlatforms = PLATFORM_ORDER.filter(
    (key) => links[key] && links[key]!.trim() !== ""
  );

  if (activePlatforms.length === 0) return null;

  return (
    <div
      className={`flex items-center gap-2 overflow-x-auto pb-1 flex-nowrap ${className}`}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {activePlatforms.map((platform, index) => {
        const linkContent = (
          <Image
            src={PLATFORM_LOGO[platform]}
            alt={PLATFORM_LABEL[platform]}
            width={24}
            height={24}
            className="w-6 h-6 md:w-[18px] md:h-[18px] object-contain rounded"
          />
        );

        if (animate) {
          return (
            <motion.a
              key={platform}
              href={links[platform]!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-8 py-2 md:px-7 md:py-1 rounded-lg hover:opacity-80 transition-opacity flex-shrink-0"
              style={{
                backgroundColor: colors.box,
                border: `1px solid ${colors.boxOutline}`,
              }}
              aria-label={PLATFORM_LABEL[platform]}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: 0.5 + index * 0.05,
                ease: EASE_OUT,
              }}
              whileHover={{ scale: 1.15, y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              {linkContent}
            </motion.a>
          );
        }

        return (
          <a
            key={platform}
            href={links[platform]!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-8 py-2 md:px-7 md:py-1 rounded-lg hover:opacity-80 transition-opacity flex-shrink-0"
            style={{
              backgroundColor: colors.box,
              border: `1px solid ${colors.boxOutline}`,
            }}
            aria-label={PLATFORM_LABEL[platform]}
          >
            {linkContent}
          </a>
        );
      })}
    </div>
  );
};
