"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HeroSection } from "../molecules/HeroSection";
import { TagSidebar } from "../molecules/TagSidebar";
import { IssuerGrid } from "../molecules/IssuerGrid";
import { IssuerListView } from "../molecules/IssuerListView";
import { IssuerData, IssuerListData } from "@/lib/types";
import { Navigation } from "../molecules/Navigation";
import { TagItemData, ViewMode, SortMode } from "../atoms";
import { colors } from "@/lib/constants/colors";

interface SelectedTagInfo {
  name: string;
  description?: string | null;
  issuerCount: number;
  marketCap: number;
  photoUrl?: string | null;
}

interface MainPageTemplateProps {
  // Market data
  issuerCount: number;
  marketCap: number;
  marketCapChange: number;

  // Tags
  tags: TagItemData[];
  tagsLoading?: boolean;

  // Issuers for card view (by sort mode)
  biggestIssuers: IssuerData[];
  trendingIssuers: IssuerData[];
  newestIssuers: IssuerData[];
  alphabeticalIssuers: IssuerData[];

  // Issuers for list view
  listViewIssuers: IssuerListData[];

  issuersLoading?: boolean;

  // Auth state
  isAuthenticated?: boolean;
  username?: string;

  // Callbacks
  onIssuerClick?: (issuer: IssuerData) => void;
  onListIssuerClick?: (issuer: IssuerListData) => void;
  onTagSelect?: (tag: TagItemData) => void;
  onSearch?: (query: string) => void;

  // Tag selection state
  selectedTag?: SelectedTagInfo | null;
  initialTagId?: string | null;
}

/**
 * MainPageTemplate - The complete main page layout
 * Combines header, hero, sidebar, and issuer grid/list
 */
export function MainPageTemplate({
  issuerCount,
  marketCap,
  marketCapChange,
  tags,
  tagsLoading = false,
  biggestIssuers,
  trendingIssuers,
  newestIssuers,
  alphabeticalIssuers,
  listViewIssuers,
  issuersLoading = false,
  isAuthenticated = false,
  username,
  onIssuerClick,
  onListIssuerClick,
  onTagSelect,
  onSearch,
  selectedTag = null,
  initialTagId = null,
}: MainPageTemplateProps) {
  const router = useRouter();

  // View and sort state
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [sortMode, setSortMode] = useState<SortMode>("biggest");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(initialTagId);

  // Sync selectedTagId when initialTagId changes (e.g. after async tag load or navigation)
  useEffect(() => {
    // Always sync, even if null (which happens when navigating to home / clearing filters)
    setSelectedTagId(initialTagId);
  }, [initialTagId]);

  // Get current issuers based on sort mode
  const getCurrentIssuers = (): IssuerData[] => {
    switch (sortMode) {
      case "trending":
        return trendingIssuers;
      case "newest":
        return newestIssuers;
      case "alphabetical":
        return alphabeticalIssuers;
      case "biggest":
      default:
        return biggestIssuers;
    }
  };

  // Handle issuer selection
  const handleIssuerClick = (issuer: IssuerData) => {
    if (onIssuerClick) {
      onIssuerClick(issuer);
    } else {
      router.push(`/issuer/${issuer.ticker}`);
    }
  };

  const handleListIssuerClick = (issuer: IssuerListData) => {
    if (onListIssuerClick) {
      onListIssuerClick(issuer);
    } else {
      router.push(`/issuer/${issuer.ticker}`);
    }
  };

  // Handle tag selection
  const handleTagSelect = (tag: TagItemData) => {
    const newTagId = tag.id === selectedTagId ? null : tag.id;
    setSelectedTagId(newTagId);

    // Execute callback if provided (backward compatibility)
    if (onTagSelect) {
      onTagSelect(tag);
      return;
    }

    // Default behavior: Navigate with query param
    const url = new URL(window.location.href);
    if (newTagId) {
      url.searchParams.set("tag", tag.name.toLowerCase());
    } else {
      url.searchParams.delete("tag");
    }
    // Reset offset/pagination if present (start fresh filtering)
    url.searchParams.delete("offset");

    // Use router to navigate (shallow if possible? Server Components usually verify this)
    // For Server Components we want full navigation to re-run server loader
    router.push(url.pathname + url.search);
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.backgroundDark }}
    >
      {/* Main Container with Max Width */}
      <div style={{ maxWidth: "1250px", margin: "0 auto", width: "100%" }}>
        {/* Hero Section */}
        <HeroSection
          issuerCount={issuerCount}
          marketCap={marketCap}
          marketCapChange={marketCapChange}
          selectedTag={selectedTag}
        />

        {/* Mobile Tags Strip */}
        <div className="lg:hidden px-4 md:px-5 mb-2 relative">
          {/* Right edge fade indicator for scrolling */}
          <div
            className="absolute right-0 top-0 bottom-1 w-12 pointer-events-none z-10"
            style={{
              background: `linear-gradient(to right, transparent, ${colors.backgroundDark})`
            }}
          />
          <div
            className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 relative z-0"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {tagsLoading ? (
              <div
                className="text-sm"
                style={{ color: colors.textMuted, padding: "8px 4px" }}
              >
                Loading tags...
              </div>
            ) : (
              tags.map((tag) => {
                // Format market cap matching desktop logic
                const formatMarketCap = (value: number): string => {
                  if (!isFinite(value)) return "—";
                  if (value >= 1_000_000_000) {
                    return `$${(value / 1_000_000_000).toFixed(2)}B`;
                  }
                  if (value >= 1_000_000) {
                    return `$${(value / 1_000_000).toFixed(2)}M`;
                  }
                  if (value >= 1_000) {
                    return `$${(value / 1_000).toFixed(2)}K`;
                  }
                  return `$${value.toFixed(0)}`;
                };

                return (
                  <button
                    key={tag.id}
                    onClick={() => handleTagSelect(tag)}
                    className={`min-w-[140px] flex-shrink-0 rounded-lg border text-left px-3 py-2 transition-colors ${selectedTagId === tag.id
                      ? "border-accent-logo bg-box-light"
                      : "border-box-outline bg-box"
                      }`}
                    style={{
                      borderColor:
                        selectedTagId === tag.id ? colors.textPrimary : colors.border,
                      backgroundColor:
                        selectedTagId === tag.id ? colors.boxHover : colors.box,
                    }}
                  >
                    <div
                      className="text-sm font-semibold truncate"
                      style={{ color: colors.textPrimary }}
                    >
                      {tag.name.charAt(0).toUpperCase() + tag.name.slice(1).toLowerCase()}
                    </div>
                    <div className="flex items-end justify-between gap-3 text-xs pt-1">
                      <span style={{ color: colors.textMuted }}>
                        {tag.issuerCount} Issuers
                      </span>
                      <span style={{ color: colors.green, fontWeight: 600 }}>
                        {formatMarketCap(tag.marketCap)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Tags and Main Content Container */}
        <div className="px-4 md:px-5 mb-5">
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            {/* Left side - Tags Sidebar (desktop only) */}
            <div className="hidden lg:block">
              <TagSidebar
                tags={tags}
                selectedTagId={selectedTagId}
                onTagSelect={handleTagSelect}
                isLoading={tagsLoading}
              />
            </div>

            {/* Right side - Controls and Content */}
            <div style={{ flex: "1", minWidth: "0" }}>
              {/* Navigation */}
              <div>
                <Navigation
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  sortMode={sortMode}
                  onSortModeChange={setSortMode}
                  showSortButtons={viewMode === "card"}
                />
              </div>

              {/* Content Area */}
              <div className="mt-3">
                {viewMode === "list" ? (
                  <IssuerListView
                    issuers={listViewIssuers}
                    isLoading={issuersLoading}
                    onIssuerClick={handleListIssuerClick}
                  />
                ) : (
                  <IssuerGrid
                    issuers={getCurrentIssuers()}
                    isLoading={issuersLoading}
                    onIssuerClick={handleIssuerClick}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
