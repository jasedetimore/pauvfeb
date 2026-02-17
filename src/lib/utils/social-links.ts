import { SocialPlatform } from "@/lib/types/issuer-links";

const PLATFORM_BASE_URLS: Record<SocialPlatform, string> = {
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/@",
  youtube: "https://youtube.com/@",
  linkedin: "https://linkedin.com/in/",
  x: "https://x.com/",
  threads: "https://threads.net/@",
  facebook: "https://facebook.com/",
  telegram: "https://t.me/",
  reddit: "https://reddit.com/r/",
  twitch: "https://twitch.tv/",
  linktree: "https://linktr.ee/",
};

function parseValueAsUrl(value: string): URL | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
}

function stripLeadingAt(value: string): string {
  return value.replace(/^@+/, "");
}

export function sanitizeHandleInput(value: string): string {
  return stripLeadingAt(value.trim()).replace(/^\/+|\/+$/g, "");
}

export function extractHandleFromLinkValue(platform: SocialPlatform, value: string | null): string {
  if (!value) return "";

  const url = parseValueAsUrl(value);
  if (!url) {
    const raw = sanitizeHandleInput(value);
    if (!raw) return "";
    return raw.includes("/") ? raw.split("/").filter(Boolean).pop() || "" : raw;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "";

  if (platform === "reddit") {
    if (["r", "u", "user"].includes(segments[0]?.toLowerCase() || "")) {
      return stripLeadingAt(segments[1] || "");
    }
    return stripLeadingAt(segments[0]);
  }

  if (platform === "linkedin") {
    if (["in", "company", "school"].includes(segments[0]?.toLowerCase() || "")) {
      return stripLeadingAt(segments[1] || "");
    }
    return stripLeadingAt(segments[0]);
  }

  return stripLeadingAt(segments[segments.length - 1] || "");
}

export function buildSocialLinkFromHandle(platform: SocialPlatform, rawHandle: string): string | null {
  const handle = sanitizeHandleInput(rawHandle);
  if (!handle) return null;
  return `${PLATFORM_BASE_URLS[platform]}${handle}`;
}

export function getSocialLinkPreview(platform: SocialPlatform, rawHandle: string): string {
  return buildSocialLinkFromHandle(platform, rawHandle) || "";
}