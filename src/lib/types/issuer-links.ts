/**
 * Issuer Links Types
 * Type definitions for issuer social media links
 */

/** Social media platform keys available for issuer links */
export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "x"
  | "threads"
  | "facebook"
  | "telegram"
  | "reddit"
  | "twitch"
  | "linktree";

/** Database row shape for issuer_links table */
export interface IssuerLinksDB {
  id: string;
  ticker: string;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  linkedin: string | null;
  x: string | null;
  threads: string | null;
  facebook: string | null;
  telegram: string | null;
  reddit: string | null;
  twitch: string | null;
  linktree: string | null;
  created_at: string;
  updated_at: string;
}

/** All social platform columns for iteration */
export const SOCIAL_PLATFORMS: { key: SocialPlatform; label: string; placeholder: string }[] = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@username" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  { key: "x", label: "X", placeholder: "https://x.com/username" },
  { key: "threads", label: "Threads", placeholder: "https://threads.net/@username" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/page" },
  { key: "telegram", label: "Telegram", placeholder: "https://t.me/channel" },
  { key: "reddit", label: "Reddit", placeholder: "https://reddit.com/r/community" },
  { key: "twitch", label: "Twitch", placeholder: "https://twitch.tv/username" },
  { key: "linktree", label: "Linktree", placeholder: "https://linktr.ee/username" },
];
