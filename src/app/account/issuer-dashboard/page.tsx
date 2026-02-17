"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/constants/colors";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { ImageUpload } from "@/components/atoms/ImageUpload";
import { SOCIAL_PLATFORMS, SocialPlatform } from "@/lib/types/issuer-links";
import {
  buildSocialLinkFromHandle,
  extractHandleFromLinkValue,
  getSocialLinkPreview,
  sanitizeHandleInput,
} from "@/lib/utils/social-links";

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

interface IssuerLinksData {
  id: string;
  ticker: string;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  linkedin: string | null;
  x: string | null;
  threads: string | null;
  facebook: string | null;
  telegram: string | null;
  reddit: string | null;
  twitch: string | null;
  linktree: string | null;
}

const emptyLinkForm: Record<SocialPlatform, string> = {
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

export default function IssuerDashboardPage() {
  const router = useRouter();
  const { isIssuer, isLoading: authLoading } = useAuth();

  // Data states
  const [details, setDetails] = useState<IssuerDetails | null>(null);
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Details form
  const [detailsForm, setDetailsForm] = useState({
    name: "",
    ticker: "",
    bio: "",
    headline: "",
    tag: "",
    photo: "",
  });

  // Links form
  const [linkForm, setLinkForm] = useState<Record<SocialPlatform, string>>({ ...emptyLinkForm });

  // Save states
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<"details" | "links">("details");

  // Helper to get token
  const getToken = async () => {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  // Fetch issuer profile
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const res = await fetch("/api/issuer/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to load profile");
      }

      const { details: d, links, tags: t } = json.data;

      setDetails(d);
      setTags(t || []);

      // Populate details form
      setDetailsForm({
        name: d.name || "",
        ticker: d.ticker || "",
        bio: d.bio || "",
        headline: d.headline || "",
        tag: d.tag || "",
        photo: d.photo || "",
      });

      // Populate links form
      if (links) {
        const formValues: Record<SocialPlatform, string> = { ...emptyLinkForm };
        for (const platform of SOCIAL_PLATFORMS) {
          formValues[platform.key] = extractHandleFromLinkValue(platform.key, links[platform.key]);
        }
        setLinkForm(formValues);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isIssuer) {
      router.replace("/account");
      return;
    }
    if (!authLoading && isIssuer) {
      fetchProfile();
    }
  }, [authLoading, isIssuer, router, fetchProfile]);

  // Update link field
  const updatePlatform = (key: SocialPlatform, value: string) => {
    setLinkForm((prev) => ({ ...prev, [key]: sanitizeHandleInput(value) }));
  };

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const payload: Record<string, unknown> = {};

      if (activeTab === "details") {
        payload.details = {
          name: detailsForm.name,
          headline: detailsForm.headline || null,
          bio: detailsForm.bio || null,
          tag: detailsForm.tag || null,
          photo: detailsForm.photo || null,
        };
      } else {
        const linksPayload: Record<SocialPlatform, string | null> = { ...emptyLinkForm };
        for (const platform of SOCIAL_PLATFORMS) {
          linksPayload[platform.key] = buildSocialLinkFromHandle(platform.key, linkForm[platform.key]);
        }
        payload.links = linksPayload;
      }

      const res = await fetch("/api/issuer/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save");

      setSaveSuccess(
        activeTab === "details"
          ? "Profile details saved!"
          : "Social links saved!"
      );

      // Update local state with returned data
      if (json.data?.details) {
        setDetails(json.data.details);
      }

      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: colors.box,
    borderColor: colors.boxOutline,
    color: colors.textPrimary,
  };

  const labelStyle: React.CSSProperties = {
    color: colors.textSecondary,
  };

  // Loading states
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p style={{ color: colors.textSecondary }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="p-6 rounded-lg text-center"
          style={{ backgroundColor: colors.box, border: `1px solid ${colors.boxOutline}` }}
        >
          <p className="text-sm mb-4" style={{ color: colors.red }}>{error}</p>
          <button
            onClick={fetchProfile}
            className="px-6 py-2 rounded font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: colors.gold, color: colors.textDark }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!details) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: colors.gold }}>
          Issuer Dashboard
        </h1>
        <span
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${colors.gold}20`, color: colors.gold }}
        >
          {details.ticker}
        </span>
      </div>

      {/* Tab Switcher */}
      <div
        className="flex gap-1 p-1 rounded-lg mb-6 w-fit"
        style={{ backgroundColor: colors.box }}
      >
        <button
          type="button"
          onClick={() => { setActiveTab("details"); setSaveError(null); setSaveSuccess(null); }}
          className="px-5 py-2 rounded-md text-sm font-medium transition-colors"
          style={{
            backgroundColor: activeTab === "details" ? colors.boxLight : "transparent",
            color: activeTab === "details" ? colors.textPrimary : colors.textMuted,
          }}
        >
          Profile Details
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("links"); setSaveError(null); setSaveSuccess(null); }}
          className="px-5 py-2 rounded-md text-sm font-medium transition-colors"
          style={{
            backgroundColor: activeTab === "links" ? colors.boxLight : "transparent",
            color: activeTab === "links" ? colors.textPrimary : colors.textMuted,
          }}
        >
          Social Links
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSave}>
        {activeTab === "details" ? (
          <div
            className="rounded-lg p-6"
            style={{ backgroundColor: colors.box, border: `1px solid ${colors.boxOutline}` }}
          >
            <h2 className="text-lg font-semibold mb-5" style={{ color: colors.textPrimary }}>
              Edit Profile
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={detailsForm.name}
                    onChange={(e) => setDetailsForm({ ...detailsForm, name: e.target.value })}
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
                    value={detailsForm.ticker}
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
                    value={detailsForm.headline}
                    onChange={(e) => setDetailsForm({ ...detailsForm, headline: e.target.value })}
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                    style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                    placeholder="Software Engineer & Content Creator"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    Tag
                  </label>
                  <select
                    value={detailsForm.tag}
                    onChange={(e) => setDetailsForm({ ...detailsForm, tag: e.target.value })}
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

                <div>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
                    Bio
                  </label>
                  <textarea
                    value={detailsForm.bio}
                    onChange={(e) => setDetailsForm({ ...detailsForm, bio: e.target.value })}
                    className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                    style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                    rows={5}
                    placeholder="Tell people about yourself..."
                  />
                </div>
              </div>

              {/* Right column — Photo */}
              <div>
                <ImageUpload
                  value={detailsForm.photo}
                  onChange={(url) => setDetailsForm({ ...detailsForm, photo: url })}
                  folder="issuers"
                  uploadEndpoint="/api/issuer/upload"
                  label="Profile Photo"
                  disabled={saving}
                  aspectRatio={1}
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-lg p-6"
            style={{ backgroundColor: colors.box, border: `1px solid ${colors.boxOutline}` }}
          >
            <h2 className="text-lg font-semibold mb-5" style={{ color: colors.textPrimary }}>
              Social Links
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SOCIAL_PLATFORMS.map((platform) => (
                <div key={platform.key}>
                  <label className="block text-sm font-medium mb-1" style={labelStyle}>
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
                      onChange={(e) => updatePlatform(platform.key, e.target.value)}
                      placeholder="username"
                      className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                      style={{ ...inputStyle, "--tw-ring-color": colors.gold } as React.CSSProperties}
                    />
                  </div>
                  <p className="mt-1 text-xs" style={{ color: colors.textMuted }}>
                    {getSocialLinkPreview(platform.key, linkForm[platform.key]) || " "}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Messages */}
        {saveError && (
          <div
            className="mt-4 p-3 rounded-lg border text-sm"
            style={{
              backgroundColor: `${colors.red}20`,
              borderColor: colors.red,
              color: colors.red,
            }}
          >
            {saveError}
          </div>
        )}

        {saveSuccess && (
          <div
            className="mt-4 p-3 rounded-lg border text-sm"
            style={{
              backgroundColor: `${colors.green}20`,
              borderColor: colors.green,
              color: colors.green,
            }}
          >
            {saveSuccess}
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full lg:w-auto px-10 py-3 rounded-lg font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: colors.gold, color: colors.textDark }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
