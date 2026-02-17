"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";
import { colors } from "@/lib/constants/colors";
import { IssuerCardData, IssuersApiResponse } from "@/lib/types";
import { CachedIssuerStats } from "@/lib/hooks/useIssuerStats";

interface SearchDropdownProps {
  /** Pre-loaded stats map for price lookups */
  statsMap?: Map<string, CachedIssuerStats>;
}

/**
 * SearchDropdown - Search bar with live issuer results dropdown
 * Shows 3 most recent issuers on focus, filters as user types
 * Each result shows photo, name, tag, and price (similar to IssuerCard)
 */
export function SearchDropdown({ statsMap }: SearchDropdownProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<IssuerCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch issuers from API
  const fetchIssuers = useCallback(async (searchTerm: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }
      params.set("limit", "3");

      const response = await fetch(`/api/issuers?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch");

      const data: IssuersApiResponse = await response.json();
      setResults(data.issuers || []);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // On focus, show 3 most recent issuers
  const handleFocus = () => {
    setIsOpen(true);
    if (results.length === 0 && !query.trim()) {
      fetchIssuers("");
    }
  };

  // Debounced search as user types
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchIssuers(value);
    }, 250);
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clean up debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Navigate to issuer page and fire GA event
  // Uses GA4 custom dimensions: issuer_id, issuer_name, tag_name
  const handleSelect = (issuer: IssuerCardData) => {
    setIsOpen(false);
    sendGAEvent('event', 'search_issuer_select', {
      issuer_id: issuer.ticker,
      issuer_name: issuer.fullName,
      tag_name: issuer.primaryTag || 'none',
      search_query: query.trim() || '(recent)',
    });
    setQuery("");
    router.push(`/issuer/${encodeURIComponent(issuer.ticker.toLowerCase())}`);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Get stats for an issuer from cache (missing means not listed yet)
  const getStats = (ticker: string): CachedIssuerStats | null => {
    if (!statsMap) return null;
    return statsMap.get(ticker) ?? null;
  };

  // Format price
  const formatPrice = (price: number): string => {
    if (!isFinite(price) || price === 0) return "$0.00";
    if (price >= 10000) {
      return `$${price.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
    }
    if (price >= 100) {
      return `$${price.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
    }
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 5, maximumFractionDigits: 5 })}`;
  };

  const capitalizeFirstLetter = (str: string): string => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input */}
      <form onSubmit={(e) => e.preventDefault()} className="flex items-center relative">
        <svg
          className="absolute left-3 w-4 h-4"
          style={{ color: colors.textMuted }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search issuers..."
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-3 py-2 rounded-lg text-sm border w-[280px] focus:outline-none focus:ring-1"
          style={{
            background: colors.navbarBg,
            color: colors.textPrimary,
            borderColor: colors.border,
          }}
        />
      </form>

      {/* Dropdown Results */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-lg border overflow-hidden shadow-xl"
          style={{
            backgroundColor: colors.box,
            borderColor: colors.boxOutline,
            zIndex: 100,
            minWidth: "320px",
          }}
        >
          {isLoading && results.length === 0 ? (
            <div
              className="px-4 py-3 text-sm text-center"
              style={{ color: colors.textMuted }}
            >
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div
              className="px-4 py-3 text-sm text-center"
              style={{ color: colors.textMuted }}
            >
              No issuers found
            </div>
          ) : (
            <>
              {/* Section label */}
              <div
                className="px-3 py-2 text-xs font-medium uppercase tracking-wider"
                style={{
                  color: colors.textMuted,
                  borderBottom: `1px solid ${colors.boxOutline}`,
                }}
              >
                {query.trim() ? "Results" : "Recent Issuers"}
              </div>

              {/* Issuer Results */}
              {results.map((issuer) => (
                (() => {
                  const stat = getStats(issuer.ticker);
                  return (
                <SearchResultItem
                  key={issuer.ticker}
                  issuer={issuer}
                  price={stat?.currentPrice ?? 0}
                  isTradable={Boolean(stat)}
                  formatPrice={formatPrice}
                  capitalizeFirstLetter={capitalizeFirstLetter}
                  onClick={() => handleSelect(issuer)}
                />
                  );
                })()
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ----- Subcomponent: Individual search result item -----

interface SearchResultItemProps {
  issuer: IssuerCardData;
  price: number;
  isTradable: boolean;
  formatPrice: (price: number) => string;
  capitalizeFirstLetter: (str: string) => string;
  onClick: () => void;
}

function SearchResultItem({
  issuer,
  price,
  isTradable,
  formatPrice,
  capitalizeFirstLetter,
  onClick,
}: SearchResultItemProps) {
  const [imageError, setImageError] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const initials = issuer.fullName
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 3)
    .toUpperCase() || issuer.ticker.slice(0, 3).toUpperCase();

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 12px",
        cursor: "pointer",
        transition: "background-color 0.15s",
        backgroundColor: isHovered ? colors.boxHover : "transparent",
        borderBottom: `1px solid ${colors.boxOutline}`,
      }}
    >
      {/* Photo / Initials */}
      <div
        style={{
          width: "44px",
          height: "44px",
          backgroundColor: colors.textPrimary,
          flexShrink: 0,
          borderRadius: "5px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {issuer.imageUrl && !imageError ? (
          <img
            src={issuer.imageUrl}
            alt={`${issuer.ticker} logo`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <span
            style={{
              color: colors.textMuted,
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Info section */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row: name (left) + ticker (right) */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "6px" }}>
          <span
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: colors.textPrimary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {issuer.fullName}
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: colors.gold,
              fontFamily: "monospace",
              flexShrink: 0,
            }}
          >
            ${issuer.ticker}
          </span>
        </div>

        {/* Bottom row: tag + price */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "3px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              color: colors.textMuted,
              fontWeight: "400",
            }}
          >
            {issuer.primaryTag ? capitalizeFirstLetter(issuer.primaryTag) : "—"}
          </span>

          {isTradable ? (
            <span
              style={{
                fontSize: "13px",
                fontWeight: "400",
                color: colors.textPrimary,
              }}
            >
              {formatPrice(price)}
            </span>
          ) : (
            <span
              style={{
                fontSize: "13px",
                fontWeight: "400",
                fontStyle: "italic",
                color: colors.textPrimary,
              }}
            >
              Launching soon...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
