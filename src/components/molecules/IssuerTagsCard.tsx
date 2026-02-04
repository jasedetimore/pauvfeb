"use client";

import React from "react";
import Link from "next/link";
import { colors } from "@/lib/constants/colors";

type TagInput = string | { tag_name?: string; name?: string } | null | undefined;

interface IssuerTagsCardProps {
  tags: TagInput[];
  isLoading?: boolean;
}

// Helper to extract tag name from various formats
const getTagName = (tag: TagInput): string | null => {
  if (!tag) return null;
  if (typeof tag === "string") return tag;
  if (typeof tag === "object") {
    return tag.tag_name || tag.name || null;
  }
  return null;
};

/**
 * IssuerTagsCard - Displays tags/categories for an issuer
 * Tags are clickable and link to tag-filtered views
 */
export const IssuerTagsCard: React.FC<IssuerTagsCardProps> = ({
  tags,
  isLoading = false,
}) => {
  // Filter, normalize, and dedupe tags
  const normalizedTags = [
    ...new Set(
      tags.map(getTagName).filter((tag): tag is string => Boolean(tag))
    ),
  ];

  if (isLoading) {
    return (
      <div
        className="p-4 rounded-xl"
        style={{ backgroundColor: colors.background }}
      >
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-8 w-24 rounded-full animate-pulse"
              style={{ backgroundColor: colors.boxLight }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!normalizedTags || normalizedTags.length === 0) {
    return null;
  }

  // Build path for tag navigation
  const buildTagPath = (index: number): string => {
    const pathSegments = normalizedTags
      .slice(0, index + 1)
      .map((tag) => encodeURIComponent(tag.toLowerCase()));
    return `/tags/${pathSegments.join("/")}`;
  };

  return (
    <div
      className="p-4 rounded-xl"
      style={{ backgroundColor: colors.background }}
    >
      <div className="flex flex-wrap gap-2">
        {normalizedTags.map((tagName, index) => (
          <Link
            key={index}
            href={buildTagPath(index)}
            className="px-4 py-2 rounded-md font-mono text-sm uppercase transition-colors"
            style={{
              backgroundColor: "transparent",
              border: `1px solid ${colors.boxOutline}`,
              color: colors.textPrimary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.boxLight;
              e.currentTarget.style.borderColor = colors.textSecondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = colors.boxOutline;
            }}
          >
            {tagName}
          </Link>
        ))}
      </div>
    </div>
  );
};
