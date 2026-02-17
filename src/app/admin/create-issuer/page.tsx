"use client";

import React, { useState, useEffect, useCallback } from "react";
import { colors } from "@/lib/constants/colors";
import { AdminSearchBar } from "@/components/atoms/AdminSearchBar";
import { ImageUpload } from "@/components/atoms/ImageUpload";

interface TagData {
  id: string;
  tag: string;
}

export default function AdminCreateIssuerPage() {
  const [issuerForm, setIssuerForm] = useState({
    name: "",
    ticker: "",
    bio: "",
    headline: "",
    tag: "",
    photo: "",
  });
  const [issuerLoading, setIssuerLoading] = useState(false);
  const [issuerError, setIssuerError] = useState<string | null>(null);
  const [issuerSuccess, setIssuerSuccess] = useState<string | null>(null);

  // Tags for dropdown
  const [tags, setTags] = useState<TagData[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  // Existing issuers for the table
  interface IssuerRow {
    id: string;
    name: string;
    ticker: string;
    tag: string | null;
    created_at: string;
  }
  const [issuers, setIssuers] = useState<IssuerRow[]>([]);
  const [filteredIssuers, setFilteredIssuers] = useState<IssuerRow[]>([]);
  const [loadingIssuers, setLoadingIssuers] = useState(false);

  // Fetch tags
  useEffect(() => {
    (async () => {
      setLoadingTags(true);
      try {
        const res = await fetch("/api/tags");
        const json = await res.json();
        if (json.tags && Array.isArray(json.tags)) {
          setTags(
            json.tags.map((t: { id: string; name: string }) => ({
              id: t.id,
              tag: t.name,
            }))
          );
        }
      } catch {
        /* ignore */
      } finally {
        setLoadingTags(false);
      }
    })();
  }, []);

  // Fetch all issuers
  const fetchIssuers = useCallback(async () => {
    setLoadingIssuers(true);
    try {
      const res = await fetch("/api/admin/issuers");
      const json = await res.json();
      if (json.success && json.data) {
        setIssuers(json.data);
        setFilteredIssuers(json.data);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingIssuers(false);
    }
  }, []);

  useEffect(() => {
    fetchIssuers();
  }, [fetchIssuers]);

  // Search handler
  const handleSearch = useCallback(
    (query: string) => {
      if (!query) {
        setFilteredIssuers(issuers);
        return;
      }
      const q = query.toLowerCase();
      setFilteredIssuers(
        issuers.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.ticker.toLowerCase().includes(q)
        )
      );
    },
    [issuers]
  );

  // Create issuer
  const handleCreateIssuer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssuerLoading(true);
    setIssuerError(null);
    setIssuerSuccess(null);

    try {
      const response = await fetch("/api/admin/issuers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issuerForm),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Failed to create issuer");

      setIssuerSuccess(`Successfully created issuer: ${issuerForm.ticker}`);
      setIssuerForm({ name: "", ticker: "", bio: "", headline: "", tag: "", photo: "" });
      fetchIssuers();
    } catch (error) {
      setIssuerError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIssuerLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.box,
    borderColor: colors.boxOutline,
    color: colors.textPrimary,
  };
  const labelStyle = { color: colors.textSecondary };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: colors.gold }}>
        Create Issuer
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left – Form */}
        <div
          className="p-6 rounded-lg"
          style={{ backgroundColor: colors.box, border: `1px solid ${colors.boxOutline}` }}
        >
          <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
            Add a new issuer to the platform. They will be added to issuer_details.
          </p>

          <form onSubmit={handleCreateIssuer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>
                Name *
              </label>
              <input
                type="text"
                required
                value={issuerForm.name}
                onChange={(e) => setIssuerForm({ ...issuerForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>
                Ticker * (uppercase, unique)
              </label>
              <input
                type="text"
                required
                value={issuerForm.ticker}
                onChange={(e) =>
                  setIssuerForm({ ...issuerForm, ticker: e.target.value.toUpperCase() })
                }
                className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1 uppercase"
                style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                placeholder="JDOE"
                maxLength={10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>
                Headline
              </label>
              <input
                type="text"
                value={issuerForm.headline}
                onChange={(e) => setIssuerForm({ ...issuerForm, headline: e.target.value })}
                className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                placeholder="Software Engineer & Content Creator"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>
                Bio
              </label>
              <textarea
                value={issuerForm.bio}
                onChange={(e) => setIssuerForm({ ...issuerForm, bio: e.target.value })}
                className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                rows={3}
                placeholder="A brief bio about the issuer..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>
                Tag {loadingTags && "(Loading...)"}
              </label>
              <select
                value={issuerForm.tag}
                onChange={(e) => setIssuerForm({ ...issuerForm, tag: e.target.value })}
                className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                disabled={loadingTags}
              >
                <option value="">
                  {loadingTags
                    ? "Loading tags..."
                    : tags.length === 0
                    ? "No tags available"
                    : "Select a tag..."}
                </option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.tag}>
                    {tag.tag}
                  </option>
                ))}
              </select>
            </div>

            <ImageUpload
              value={issuerForm.photo}
              onChange={(url) => setIssuerForm({ ...issuerForm, photo: url })}
              folder="issuers"
              label="Photo"
              disabled={issuerLoading}
              aspectRatio={1}
            />

            {issuerError && (
              <div
                className="p-3 rounded"
                style={{ backgroundColor: `${colors.red}20`, border: `1px solid ${colors.red}` }}
              >
                <p className="text-sm" style={{ color: colors.red }}>
                  {issuerError}
                </p>
              </div>
            )}

            {issuerSuccess && (
              <div
                className="p-3 rounded"
                style={{ backgroundColor: `${colors.green}20`, border: `1px solid ${colors.green}` }}
              >
                <p className="text-sm" style={{ color: colors.green }}>
                  {issuerSuccess}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={issuerLoading}
              className="w-full py-3 rounded font-semibold transition-colors disabled:opacity-50"
              style={{ backgroundColor: colors.gold, color: colors.textDark }}
            >
              {issuerLoading ? "Creating..." : "Create Issuer"}
            </button>
          </form>
        </div>

        {/* Right – Issuers Table */}
        <div
          className="p-6 rounded-lg"
          style={{ backgroundColor: colors.box, border: `1px solid ${colors.boxOutline}` }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
            All Issuers ({issuers.length})
          </h2>

          <AdminSearchBar onSearch={handleSearch} placeholder="Search issuers by name or ticker…" />

          {loadingIssuers ? (
            <p style={{ color: colors.textSecondary }}>Loading...</p>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.boxOutline}` }}>
                    <th className="text-left py-2 px-2" style={{ color: colors.textSecondary }}>
                      Ticker
                    </th>
                    <th className="text-left py-2 px-2" style={{ color: colors.textSecondary }}>
                      Name
                    </th>
                    <th className="text-left py-2 px-2" style={{ color: colors.textSecondary }}>
                      Tag
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssuers.map((issuer) => (
                    <tr
                      key={issuer.id}
                      style={{ borderBottom: `1px solid ${colors.boxOutline}` }}
                    >
                      <td className="py-2 px-2 font-mono" style={{ color: colors.gold }}>
                        {issuer.ticker}
                      </td>
                      <td className="py-2 px-2" style={{ color: colors.textPrimary }}>
                        {issuer.name}
                      </td>
                      <td className="py-2 px-2" style={{ color: colors.textSecondary }}>
                        {issuer.tag || "-"}
                      </td>
                    </tr>
                  ))}
                  {filteredIssuers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center" style={{ color: colors.textSecondary }}>
                        {issuers.length === 0 ? "No issuers yet" : "No matches"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
