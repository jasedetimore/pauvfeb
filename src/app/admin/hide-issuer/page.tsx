"use client";

import React, { useState, useEffect, useCallback } from "react";
import { colors } from "@/lib/constants/colors";
import { createClient } from "@/lib/supabase/client";
import { AdminSearchBar } from "@/components/atoms/AdminSearchBar";

interface HideIssuerRow {
  id: string;
  name: string;
  ticker: string;
  tag: string | null;
  photo: string | null;
  is_hidden: boolean;
  has_trading: boolean;
}

export default function AdminHideIssuerPage() {
  const [issuers, setIssuers] = useState<HideIssuerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Fetch all issuers ──
  const fetchIssuers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const res = await fetch("/api/admin/hide-issuer", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();

      if (!json.success) throw new Error(json.error || "Failed to fetch issuers");

      setIssuers(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssuers();
  }, [fetchIssuers]);

  // ── Toggle hidden ──
  const handleToggle = async (issuer: HideIssuerRow) => {
    setTogglingId(issuer.id);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const res = await fetch("/api/admin/hide-issuer", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id: issuer.id, is_hidden: !issuer.is_hidden }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to toggle");

      // Optimistic update
      setIssuers((prev) =>
        prev.map((i) =>
          i.id === issuer.id ? { ...i, is_hidden: !i.is_hidden } : i
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Client-side search filter ──
  const filtered = issuers.filter((i) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.name.toLowerCase().includes(q) ||
      i.ticker.toLowerCase().includes(q) ||
      (i.tag && i.tag.toLowerCase().includes(q))
    );
  });

  // ── Styles ──
  const thStyle: React.CSSProperties = {
    color: colors.textSecondary,
    borderColor: colors.boxOutline,
    padding: "10px 14px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const tdStyle: React.CSSProperties = {
    color: colors.textPrimary,
    borderColor: colors.boxOutline,
    padding: "10px 14px",
    fontSize: "14px",
  };

  return (
    <div>
      {/* Header */}
      <h1 className="text-2xl font-bold mb-1" style={{ color: colors.gold }}>
        Hide Issuers
      </h1>
      <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
        Toggle visibility to hide issuers from the main page and search bar.
      </p>

      {/* Search */}
      <AdminSearchBar
        onSearch={setSearchQuery}
        placeholder="Search issuers by name, ticker, or tag…"
      />

      {/* Error */}
      {error && (
        <div
          className="rounded-lg p-3 mb-4 text-sm"
          style={{ backgroundColor: colors.red + "20", color: colors.red }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <p className="text-sm" style={{ color: colors.textMuted }}>
          Loading issuers…
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm" style={{ color: colors.textMuted }}>
          {searchQuery ? "No issuers match your search." : "No issuers found."}
        </p>
      ) : (
        /* Table */
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: colors.box,
            borderColor: colors.boxOutline,
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: colors.boxLight,
                    borderBottom: `1px solid ${colors.boxOutline}`,
                  }}
                >
                  <th style={thStyle}>Issuer</th>
                  <th style={thStyle}>Ticker</th>
                  <th style={thStyle}>Tag</th>
                  <th style={thStyle}>Details</th>
                  <th style={thStyle}>Trading</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Hidden</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((issuer) => (
                  <tr
                    key={issuer.id}
                    style={{
                      borderBottom: `1px solid ${colors.boxOutline}`,
                      opacity: issuer.is_hidden ? 0.5 : 1,
                      transition: "opacity 200ms",
                    }}
                  >
                    {/* Name + photo */}
                    <td style={tdStyle}>
                      <div className="flex items-center gap-2">
                        {issuer.photo ? (
                          <img
                            src={issuer.photo}
                            alt={issuer.name}
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                            style={{
                              border: `1px solid ${colors.boxOutline}`,
                            }}
                          />
                        ) : (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{
                              backgroundColor: colors.boxLight,
                              color: colors.textMuted,
                              border: `1px solid ${colors.boxOutline}`,
                            }}
                          >
                            {issuer.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium">{issuer.name}</span>
                      </div>
                    </td>

                    {/* Ticker */}
                    <td style={tdStyle}>
                      <span
                        className="font-mono text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: colors.boxLight,
                          color: colors.gold,
                        }}
                      >
                        {issuer.ticker}
                      </span>
                    </td>

                    {/* Tag */}
                    <td style={{ ...tdStyle, color: colors.textSecondary }}>
                      {issuer.tag || "—"}
                    </td>

                    {/* Has details (always true, they're in issuer_details) */}
                    <td style={tdStyle}>
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: colors.green }}
                        title="Has details"
                      />
                    </td>

                    {/* Has trading */}
                    <td style={tdStyle}>
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: issuer.has_trading
                            ? colors.green
                            : colors.boxOutline,
                        }}
                        title={
                          issuer.has_trading
                            ? "Listed for trading"
                            : "Not listed for trading"
                        }
                      />
                    </td>

                    {/* Toggle */}
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <button
                        onClick={() => handleToggle(issuer)}
                        disabled={togglingId === issuer.id}
                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                        style={{
                          backgroundColor: issuer.is_hidden
                            ? colors.red
                            : colors.boxOutline,
                          opacity: togglingId === issuer.id ? 0.5 : 1,
                          cursor:
                            togglingId === issuer.id
                              ? "wait"
                              : "pointer",
                        }}
                        title={
                          issuer.is_hidden
                            ? "Currently hidden — click to show"
                            : "Currently visible — click to hide"
                        }
                      >
                        <span
                          className="inline-block h-4 w-4 rounded-full transition-transform"
                          style={{
                            backgroundColor: colors.textPrimary,
                            transform: issuer.is_hidden
                              ? "translateX(22px)"
                              : "translateX(4px)",
                          }}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary footer */}
          <div
            className="px-4 py-2 text-xs flex justify-between"
            style={{
              borderTop: `1px solid ${colors.boxOutline}`,
              color: colors.textMuted,
            }}
          >
            <span>
              Showing {filtered.length} of {issuers.length} issuers
            </span>
            <span>
              {issuers.filter((i) => i.is_hidden).length} hidden
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
