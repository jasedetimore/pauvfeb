"use client";

import React, { useState, useCallback, useEffect } from "react";
import { colors } from "@/lib/constants/colors";
import { IssuerLinksDB, SOCIAL_PLATFORMS, SocialPlatform } from "@/lib/types/issuer-links";
import { AdminSearchBar } from "@/components/atoms/AdminSearchBar";
import {
  buildSocialLinkFromHandle,
  extractHandleFromLinkValue,
  getSocialLinkPreview,
  sanitizeHandleInput,
} from "@/lib/utils/social-links";

interface IssuerListItem {
  ticker: string;
  name: string;
}

export default function AdminIssuerLinksPage() {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Issuer list state
  const [issuerList, setIssuerList] = useState<IssuerListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // Current issuer links data
  const [issuerLinks, setIssuerLinks] = useState<IssuerLinksDB | null>(null);

  // Edit form state — keyed by platform
  const [linkForm, setLinkForm] = useState<Record<SocialPlatform, string>>({
    instagram: "",
    tiktok: "",
    youtube: "",
    linkedin: "",
    x: "",
    threads: "",
    facebook: "",
    telegram: "",
    reddit: "",
    twitch: "",
    linktree: "",
  });

  // Save state
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Fetch issuer list (initial or filtered)
  const fetchIssuerList = useCallback(async (search?: string) => {
    setListLoading(true);
    try {
      const url = search
        ? `/api/admin/issuer-links?search=${encodeURIComponent(search)}`
        : "/api/admin/issuer-links";

      const res = await fetch(url);

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to fetch issuers");
      }

      setIssuerList(json.data as IssuerListItem[]);
    } catch (err) {
      console.error("Failed to fetch issuer list:", err);
      setIssuerList([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  // Load initial list on mount
  useEffect(() => {
    fetchIssuerList();
  }, [fetchIssuerList]);

  // Select an issuer from the list
  const handleSelectIssuer = async (ticker: string) => {
    setSearchLoading(true);
    setSearchError(null);
    setSaveError(null);
    setSaveSuccess(null);
    setIssuerLinks(null);

    try {
      const res = await fetch(
        `/api/admin/issuer-links?ticker=${encodeURIComponent(ticker)}`
      );

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to fetch issuer links");
      }

      const data = json.data as IssuerLinksDB;
      setIssuerLinks(data);

      // Populate the form with current values
      const formValues: Record<SocialPlatform, string> = {
        instagram: "",
        tiktok: "",
        youtube: "",
        linkedin: "",
        x: "",
        threads: "",
        facebook: "",
        telegram: "",
        reddit: "",
        twitch: "",
        linktree: "",
      };
      for (const platform of SOCIAL_PLATFORMS) {
        formValues[platform.key] = extractHandleFromLinkValue(platform.key, data[platform.key]);
      }
      setLinkForm(formValues);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSearchLoading(false);
    }
  };

  // Update a single platform value in the form
  const updatePlatform = (key: SocialPlatform, value: string) => {
    setLinkForm((prev) => ({ ...prev, [key]: sanitizeHandleInput(value) }));
  };

  // Save all links
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuerLinks) return;

    setSaveLoading(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const res = await fetch("/api/admin/issuer-links", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker: issuerLinks.ticker,
          links: Object.fromEntries(
            SOCIAL_PLATFORMS.map((platform) => [
              platform.key,
              buildSocialLinkFromHandle(platform.key, linkForm[platform.key]),
            ])
          ),
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to save links");
      }

      setIssuerLinks(json.data as IssuerLinksDB);
      setSaveSuccess("Links saved successfully!");

      // Clear success message after a few seconds
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaveLoading(false);
    }
  };

  // Clear the current search and reset form
  const handleClear = () => {
    setSearchQuery("");
    setIssuerLinks(null);
    setSearchError(null);
    setSaveError(null);
    setSaveSuccess(null);
    setLinkForm({
      instagram: "",
      tiktok: "",
      youtube: "",
      linkedin: "",
      x: "",
      threads: "",
      facebook: "",
      telegram: "",
      reddit: "",
      twitch: "",
      linktree: "",
    });
    fetchIssuerList();
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: colors.box,
    borderColor: colors.boxOutline,
    color: colors.textPrimary,
  };

  const labelStyle: React.CSSProperties = {
    color: colors.textSecondary,
  };

  return (
    <div>
      {/* Page Header */}
      <h1 className="text-2xl font-bold mb-6" style={{ color: colors.gold }}>
        Issuer Links
      </h1>

      {/* Search Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left: Search & Issuer List */}
        <div
          className="lg:col-span-1 rounded-lg border p-6"
          style={{
            backgroundColor: colors.box,
            borderColor: colors.boxOutline,
          }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: colors.textPrimary }}
          >
            Search Issuers
          </h2>

          <AdminSearchBar
            onSearch={(q) => {
              setSearchQuery(q);
              if (q.trim()) {
                fetchIssuerList(q.trim());
              } else {
                fetchIssuerList();
              }
            }}
            placeholder="Search by ticker or name…"
          />

          {listLoading ? (
            <div className="text-center py-8" style={{ color: colors.textMuted }}>
              <p className="text-sm">Loading...</p>
            </div>
          ) : issuerList.length === 0 ? (
            <div className="text-center py-8" style={{ color: colors.textMuted }}>
              <p className="text-sm">No issuers found</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {issuerList.map((issuer) => (
                <button
                  key={issuer.ticker}
                  onClick={() => handleSelectIssuer(issuer.ticker)}
                  className="w-full text-left px-3 py-2 rounded-lg border transition-colors hover:opacity-80"
                  style={{
                    backgroundColor:
                      issuerLinks?.ticker === issuer.ticker
                        ? colors.boxLight
                        : colors.background,
                    borderColor: colors.boxOutline,
                  }}
                >
                  <div
                    className="font-medium text-sm"
                    style={{ color: colors.textPrimary }}
                  >
                    {issuer.ticker}
                  </div>
                  <div className="text-xs" style={{ color: colors.textMuted }}>
                    {issuer.name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Links Editor or Empty State */}
        <div className="lg:col-span-2">
          {searchError && (
            <div className="mb-4 text-sm" style={{ color: colors.red }}>
              {searchError}
            </div>
          )}

          {issuerLinks ? (
            <div
              className="rounded-lg border p-6"
              style={{
                backgroundColor: colors.box,
                borderColor: colors.boxOutline,
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Social Links for{" "}
                  <span style={{ color: colors.gold }}>{issuerLinks.ticker}</span>
                </h2>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 rounded-lg text-sm font-medium border transition-opacity hover:opacity-80"
                  style={{
                    borderColor: colors.boxOutline,
                    color: colors.textSecondary,
                  }}
                >
                  Clear
                </button>
              </div>

          {/* Status Messages */}
          {saveError && (
            <div
              className="mb-4 p-3 rounded-lg border text-sm"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderColor: colors.red,
                color: colors.red,
              }}
            >
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div
              className="mb-4 p-3 rounded-lg border text-sm"
              style={{
                backgroundColor: "rgba(110, 231, 183, 0.1)",
                borderColor: colors.green,
                color: colors.green,
              }}
            >
              {saveSuccess}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SOCIAL_PLATFORMS.map((platform) => (
                <div key={platform.key}>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={labelStyle}
                  >
                    {platform.label}
                  </label>
                  <div className="relative">
                    <span
                      className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm"
                      style={{ color: colors.textMuted }}
                    >
                      @
                    </span>
                    <input
                      type="text"
                      value={linkForm[platform.key]}
                      onChange={(e) =>
                        updatePlatform(platform.key, e.target.value)
                      }
                      placeholder="username"
                      className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                      style={inputStyle}
                    />
                  </div>
                  <p className="mt-1 text-xs" style={{ color: colors.textMuted }}>
                    {getSocialLinkPreview(platform.key, linkForm[platform.key]) || " "}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                type="submit"
                disabled={saveLoading}
                className="px-8 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: colors.gold,
                  color: colors.textDark,
                }}
              >
                {saveLoading ? "Saving..." : "Save Links"}
              </button>
            </div>
          </form>
        </div>
          ) : (
            <div
              className="rounded-lg border p-12 text-center"
              style={{
                backgroundColor: colors.box,
                borderColor: colors.boxOutline,
              }}
            >
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Select an issuer from the list to manage their social media links.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
