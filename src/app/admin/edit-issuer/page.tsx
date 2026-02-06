"use client";

import React, { useState, useEffect, useCallback } from "react";
import { colors } from "@/lib/constants/colors";
import { createClient } from "@/lib/supabase/client";
import { AdminSearchBar } from "@/components/atoms/AdminSearchBar";
import { ImageUpload } from "@/components/atoms/ImageUpload";

interface IssuerDetails {
  id: string;
  name: string;
  ticker: string;
  bio: string | null;
  headline: string | null;
  tag: string | null;
  photo: string | null;
}

interface TagData {
  id: string;
  tag: string;
}

export default function AdminEditIssuerPage() {
  // Issuer list
  const [issuers, setIssuers] = useState<IssuerDetails[]>([]);
  const [filteredIssuers, setFilteredIssuers] = useState<IssuerDetails[]>([]);
  const [loadingIssuers, setLoadingIssuers] = useState(false);

  // Tags for dropdown
  const [tags, setTags] = useState<TagData[]>([]);

  // Selected issuer
  const [selected, setSelected] = useState<IssuerDetails | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    ticker: "",
    bio: "",
    headline: "",
    tag: "",
    photo: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Helper to get token
  const getToken = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  // Fetch issuers
  const fetchIssuers = useCallback(async () => {
    setLoadingIssuers(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/admin/issuers", {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  // Fetch tags
  useEffect(() => {
    (async () => {
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
      }
    })();
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

  // Select issuer
  const handleSelect = (issuer: IssuerDetails) => {
    setSelected(issuer);
    setEditForm({
      name: issuer.name,
      ticker: issuer.ticker,
      bio: issuer.bio || "",
      headline: issuer.headline || "",
      tag: issuer.tag || "",
      photo: issuer.photo || "",
    });
    setSaveError(null);
    setSaveSuccess(null);
  };

  // Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/admin/issuers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: selected.id,
          name: editForm.name,
          bio: editForm.bio || null,
          headline: editForm.headline || null,
          tag: editForm.tag || null,
          photo: editForm.photo || null,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to update issuer");

      setSaveSuccess(`${editForm.ticker} updated successfully!`);
      // Refresh list
      fetchIssuers();
      // Update selected reference
      if (json.data) {
        setSelected(json.data);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSaving(false);
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
        Edit Issuer
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left – Issuer List */}
        <div
          className="lg:col-span-1 p-6 rounded-lg"
          style={{ backgroundColor: colors.box, border: `1px solid ${colors.boxOutline}` }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
            Select Issuer
          </h2>

          <AdminSearchBar onSearch={handleSearch} placeholder="Search by name or ticker…" />

          {loadingIssuers ? (
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Loading...
            </p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredIssuers.map((issuer) => (
                <button
                  key={issuer.id}
                  onClick={() => handleSelect(issuer)}
                  className="w-full text-left px-3 py-2 rounded-lg border transition-colors hover:opacity-80"
                  style={{
                    backgroundColor:
                      selected?.id === issuer.id ? colors.boxLight : colors.background,
                    borderColor: colors.boxOutline,
                  }}
                >
                  <div className="font-medium text-sm" style={{ color: colors.gold }}>
                    {issuer.ticker}
                  </div>
                  <div className="text-xs" style={{ color: colors.textMuted }}>
                    {issuer.name}
                  </div>
                </button>
              ))}
              {filteredIssuers.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: colors.textSecondary }}>
                  {issuers.length === 0 ? "No issuers yet" : "No matches"}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right – Edit Form */}
        <div className="lg:col-span-2">
          {selected ? (
            <div
              className="p-6 rounded-lg"
              style={{ backgroundColor: colors.box, border: `1px solid ${colors.boxOutline}` }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
                Editing{" "}
                <span style={{ color: colors.gold }}>{selected.ticker}</span>
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                    style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    Ticker (read-only)
                  </label>
                  <input
                    type="text"
                    value={editForm.ticker}
                    disabled
                    className="w-full px-3 py-2 rounded border opacity-60 cursor-not-allowed"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    Headline
                  </label>
                  <input
                    type="text"
                    value={editForm.headline}
                    onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
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
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                    style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    Tag
                  </label>
                  <select
                    value={editForm.tag}
                    onChange={(e) => setEditForm({ ...editForm, tag: e.target.value })}
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                    style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                  >
                    <option value="">No tag</option>
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.tag}>
                        {tag.tag}
                      </option>
                    ))}
                  </select>
                </div>

                <ImageUpload
                  value={editForm.photo}
                  onChange={(url) => setEditForm({ ...editForm, photo: url })}
                  folder="issuers"
                  label="Photo"
                  disabled={saving}
                  aspectRatio={1}
                />

                {saveError && (
                  <div
                    className="p-3 rounded"
                    style={{
                      backgroundColor: `${colors.red}20`,
                      border: `1px solid ${colors.red}`,
                    }}
                  >
                    <p className="text-sm" style={{ color: colors.red }}>
                      {saveError}
                    </p>
                  </div>
                )}

                {saveSuccess && (
                  <div
                    className="p-3 rounded"
                    style={{
                      backgroundColor: `${colors.green}20`,
                      border: `1px solid ${colors.green}`,
                    }}
                  >
                    <p className="text-sm" style={{ color: colors.green }}>
                      {saveSuccess}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 rounded font-semibold transition-colors disabled:opacity-50"
                  style={{ backgroundColor: colors.gold, color: colors.textDark }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          ) : (
            <div
              className="rounded-lg border p-12 text-center"
              style={{ backgroundColor: colors.box, borderColor: colors.boxOutline }}
            >
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Select an issuer from the list to edit their details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
