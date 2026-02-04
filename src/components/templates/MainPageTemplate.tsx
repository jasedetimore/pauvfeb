"use client";

import React, { useState } from "react";
import { AuthHeader } from "../molecules/AuthHeader";
import { HeroSection } from "../molecules/HeroSection";
import { TagSidebar } from "../molecules/TagSidebar";
import { IssuerGrid, IssuerData } from "../molecules/IssuerGrid";
import { IssuerListView, IssuerListData } from "../molecules/IssuerListView";
import { ControlsBar } from "../molecules/ControlsBar";
import { TagItemData, ViewMode, SortMode } from "../atoms";
import { colors } from "@/lib/constants/colors";

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
}: MainPageTemplateProps) {
  // View and sort state
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [sortMode, setSortMode] = useState<SortMode>("biggest");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

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

  // Handle tag selection
  const handleTagSelect = (tag: TagItemData) => {
    setSelectedTagId(tag.id === selectedTagId ? null : tag.id);
    onTagSelect?.(tag);
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.backgroundDark }}
    >
      {/* Header */}
      <AuthHeader
        onSearch={onSearch}
      />

      {/* Main Container with Max Width */}
      <div style={{ maxWidth: "1250px", margin: "0 auto", width: "100%" }}>
        {/* Hero Section */}
        <HeroSection
          issuerCount={issuerCount}
          marketCap={marketCap}
          marketCapChange={marketCapChange}
        />

        {/* Mobile Tags Strip */}
        <div className="lg:hidden px-4 md:px-5 mb-4">
          <div
            className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
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
              tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagSelect(tag)}
                  className={`min-w-[140px] flex-shrink-0 rounded-lg border text-left px-3 py-2 transition-colors ${
                    selectedTagId === tag.id
                      ? "border-accent-logo bg-box-light"
                      : "border-box-outline bg-box"
                  }`}
                  style={{
                    borderColor:
                      selectedTagId === tag.id ? colors.gold : colors.border,
                    backgroundColor:
                      selectedTagId === tag.id ? colors.boxHover : colors.box,
                  }}
                >
                  <div
                    className="text-sm font-semibold truncate"
                    style={{ color: colors.textPrimary }}
                  >
                    {tag.name}
                  </div>
                  <div className="flex items-end justify-between gap-3 text-xs pt-1">
                    <span style={{ color: colors.textMuted }}>
                      {tag.issuerCount} Issuers
                    </span>
                    <span style={{ color: colors.green, fontWeight: 600 }}>
                      ${(tag.marketCap / 1_000_000_000).toFixed(2)}B
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Tags and Main Content Container */}
        <div className="px-4 md:px-5 mb-5">
          <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
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
              {/* Controls Bar */}
              <ControlsBar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                sortMode={sortMode}
                onSortModeChange={setSortMode}
                showSortButtons={viewMode === "card"}
              />

              {/* Content Area */}
              <div className="mt-4">
                {viewMode === "list" ? (
                  <IssuerListView
                    issuers={listViewIssuers}
                    isLoading={issuersLoading}
                    onIssuerClick={onListIssuerClick}
                  />
                ) : (
                  <IssuerGrid
                    issuers={getCurrentIssuers()}
                    isLoading={issuersLoading}
                    onIssuerClick={onIssuerClick}
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
