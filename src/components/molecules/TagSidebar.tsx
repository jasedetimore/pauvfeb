"use client";

import React from "react";
import { TagItem, TagItemData } from "../atoms/TagItem";
import { colors } from "@/lib/constants/colors";

interface TagSidebarProps {
  tags: TagItemData[];
  selectedTagId?: string | null;
  onTagSelect?: (tag: TagItemData) => void;
  isLoading?: boolean;
  title?: string;
}

/**
 * TagSidebar - Sidebar showing category tags with market data
 * Allows filtering issuers by tag
 */
export function TagSidebar({
  tags,
  selectedTagId,
  onTagSelect,
  isLoading = false,
  title = "Tags",
}: TagSidebarProps) {
  return (
    <div
      className="font-mono"
      style={{
        width: "230px",
        maxWidth: "230px",
        alignSelf: "flex-start",
      }}
    >
      <div
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.border}`,
          borderRadius: "10px",
          padding: "12px 8px",
          height: "fit-content",
        }}
      >
        {/* Title */}
        <h3
          style={{
            color: colors.textPrimary,
            fontSize: "16px",
            fontWeight: "600",
            marginTop: "0",
            marginBottom: "12px",
            paddingLeft: "8px",
          }}
        >
          {title}
        </h3>

        {/* Tag List */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0",
          }}
        >
          {isLoading ? (
            <div
              style={{
                color: colors.textMuted,
                fontSize: "11px",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              Loading...
            </div>
          ) : tags.length === 0 ? (
            <div
              style={{
                color: colors.textMuted,
                fontSize: "14px",
                textAlign: "center",
                padding: "20px 12px",
              }}
            >
              No tags available
            </div>
          ) : (
            <>
              {tags.map((tag, index) => (
                <TagItem
                  key={tag.id}
                  tag={tag}
                  isSelected={selectedTagId === tag.id}
                  isLast={index === tags.length - 1}
                  onClick={() => onTagSelect?.(tag)}
                />
              ))}

              {/* Request a Tag button */}
              <div
                style={{
                  padding: "12px 8px",
                  borderTop: `1px solid ${colors.border}`,
                  marginTop: "8px",
                }}
              >
                <button
                  style={{
                    width: "100%",
                    backgroundColor: colors.background,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    padding: "10px 16px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                  }}
                >
                  + Request a Tag
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
