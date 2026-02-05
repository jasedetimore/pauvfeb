"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { colors } from "@/lib/constants/colors";
import { createClient } from "@/lib/supabase/client";
import { ImageUpload } from "@/components/atoms/ImageUpload";

interface TagData {
  id: string;
  tag: string;
  description: string | null;
  photo_url: string | null;
  number_of_issuers: number;
  created_at: string;
  updated_at: string;
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({
    tag: "",
    description: "",
    photo_url: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Edit state
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  const [editForm, setEditForm] = useState({
    description: "",
    photo_url: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Fetch tags
  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch("/api/admin/tags", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to fetch tags");
      }

      setTags(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Create tag
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tag: createForm.tag,
          description: createForm.description || null,
          photo_url: createForm.photo_url || null,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to create tag");
      }

      setCreateSuccess(`Tag "${createForm.tag}" created successfully!`);
      setCreateForm({ tag: "", description: "", photo_url: "" });
      fetchTags();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCreateLoading(false);
    }
  };

  // Start editing
  const startEdit = (tag: TagData) => {
    setEditingTag(tag);
    setEditForm({
      description: tag.description || "",
      photo_url: tag.photo_url || "",
    });
    setEditError(null);
    setEditSuccess(null);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingTag(null);
    setEditForm({ description: "", photo_url: "" });
    setEditError(null);
    setEditSuccess(null);
  };

  // Save edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag) return;

    setEditLoading(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch("/api/admin/tags", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: editingTag.id,
          description: editForm.description || null,
          photo_url: editForm.photo_url || null,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to update tag");
      }

      setEditSuccess(`Tag "${editingTag.tag}" updated successfully!`);
      fetchTags();
      setTimeout(() => {
        cancelEdit();
      }, 1500);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setEditLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.box,
    borderColor: colors.boxOutline,
    color: colors.textPrimary,
  };

  const labelStyle = {
    color: colors.textSecondary,
  };

  return (
    <div>
      {/* Header with back link */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin"
          className="px-3 py-1 rounded text-sm transition-colors hover:opacity-80"
          style={{
            backgroundColor: colors.box,
            color: colors.textSecondary,
            border: `1px solid ${colors.boxOutline}`,
          }}
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold" style={{ color: colors.gold }}>
          Manage Tags
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Create New Tag */}
        <div
          className="p-6 rounded-lg"
          style={{
            backgroundColor: colors.box,
            border: `1px solid ${colors.boxOutline}`,
          }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: colors.textPrimary }}
          >
            Create New Tag
          </h2>
          <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
            Add a new category/tag for issuers. The tag name will be normalized
            to lowercase.
          </p>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={labelStyle}
              >
                Tag Name *
              </label>
              <input
                type="text"
                required
                value={createForm.tag}
                onChange={(e) =>
                  setCreateForm({ ...createForm, tag: e.target.value })
                }
                className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                style={
                  {
                    ...inputStyle,
                    "--tw-ring-color": colors.gold,
                  } as React.CSSProperties
                }
                placeholder="e.g., comedian"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={labelStyle}
              >
                Description
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1"
                style={
                  {
                    ...inputStyle,
                    "--tw-ring-color": colors.gold,
                  } as React.CSSProperties
                }
                rows={3}
                placeholder="A short description for this tag..."
              />
            </div>

            <ImageUpload
              value={createForm.photo_url}
              onChange={(url) =>
                setCreateForm({ ...createForm, photo_url: url })
              }
              folder="tags"
              label="Photo"
              disabled={createLoading}
              aspectRatio={4 / 1}
            />

            {createError && (
              <div
                className="p-3 rounded"
                style={{
                  backgroundColor: `${colors.red}20`,
                  border: `1px solid ${colors.red}`,
                }}
              >
                <p className="text-sm" style={{ color: colors.red }}>
                  {createError}
                </p>
              </div>
            )}

            {createSuccess && (
              <div
                className="p-3 rounded"
                style={{
                  backgroundColor: `${colors.green}20`,
                  border: `1px solid ${colors.green}`,
                }}
              >
                <p className="text-sm" style={{ color: colors.green }}>
                  {createSuccess}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={createLoading}
              className="w-full py-3 rounded font-semibold transition-colors disabled:opacity-50"
              style={{
                backgroundColor: colors.gold,
                color: colors.textDark,
              }}
            >
              {createLoading ? "Creating..." : "Create Tag"}
            </button>
          </form>
        </div>

        {/* Right: Tags List */}
        <div
          className="p-6 rounded-lg"
          style={{
            backgroundColor: colors.box,
            border: `1px solid ${colors.boxOutline}`,
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: colors.textPrimary }}
            >
              All Tags ({tags.length})
            </h2>
            <button
              onClick={fetchTags}
              disabled={loading}
              className="px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
              style={{
                backgroundColor: colors.boxLight,
                color: colors.textSecondary,
                border: `1px solid ${colors.boxOutline}`,
              }}
            >
              {loading ? "..." : "↻"}
            </button>
          </div>

          {error && (
            <div
              className="p-3 rounded mb-4"
              style={{
                backgroundColor: `${colors.red}20`,
                border: `1px solid ${colors.red}`,
              }}
            >
              <p className="text-sm" style={{ color: colors.red }}>
                {error}
              </p>
            </div>
          )}

          {loading ? (
            <p style={{ color: colors.textSecondary }}>Loading tags...</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="p-4 rounded"
                  style={{
                    backgroundColor: colors.boxLight,
                    border: `1px solid ${colors.boxOutline}`,
                  }}
                >
                  {editingTag?.id === tag.id ? (
                    // Edit Mode
                    <form onSubmit={handleSaveEdit} className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="font-semibold"
                          style={{ color: colors.gold }}
                        >
                          {tag.tag}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: colors.textSecondary }}
                        >
                          (editing)
                        </span>
                      </div>

                      <div>
                        <label
                          className="block text-xs mb-1"
                          style={labelStyle}
                        >
                          Description
                        </label>
                        <textarea
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              description: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1 rounded border text-sm focus:outline-none"
                          style={{
                            ...inputStyle,
                          }}
                          rows={2}
                        />
                      </div>

                      <ImageUpload
                        value={editForm.photo_url}
                        onChange={(url) =>
                          setEditForm({
                            ...editForm,
                            photo_url: url,
                          })
                        }
                        folder="tags"
                        label="Photo"
                        disabled={editLoading}
                        aspectRatio={4 / 1}
                      />

                      {editError && (
                        <p className="text-xs" style={{ color: colors.red }}>
                          {editError}
                        </p>
                      )}

                      {editSuccess && (
                        <p className="text-xs" style={{ color: colors.green }}>
                          {editSuccess}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={editLoading}
                          className="px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
                          style={{
                            backgroundColor: colors.gold,
                            color: colors.textDark,
                          }}
                        >
                          {editLoading ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={editLoading}
                          className="px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                          style={{
                            backgroundColor: colors.box,
                            color: colors.textSecondary,
                            border: `1px solid ${colors.boxOutline}`,
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    // Display Mode
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="font-semibold"
                              style={{ color: colors.gold }}
                            >
                              {tag.tag}
                            </span>
                            <span
                              className="text-xs px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: colors.box,
                                color: colors.textSecondary,
                              }}
                            >
                              {tag.number_of_issuers} issuer
                              {tag.number_of_issuers !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <p
                            className="text-sm mb-2 line-clamp-2"
                            style={{ color: colors.textSecondary }}
                          >
                            {tag.description || (
                              <em style={{ opacity: 0.5 }}>No description</em>
                            )}
                          </p>
                          {tag.photo_url && (
                            <p
                              className="text-xs truncate"
                              style={{ color: colors.textMuted }}
                            >
                              📷 {tag.photo_url}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => startEdit(tag)}
                          className="px-3 py-1 rounded text-sm transition-colors hover:opacity-80 flex-shrink-0"
                          style={{
                            backgroundColor: colors.box,
                            color: colors.textPrimary,
                            border: `1px solid ${colors.boxOutline}`,
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {tags.length === 0 && (
                <p
                  className="text-center py-8"
                  style={{ color: colors.textSecondary }}
                >
                  No tags found. Create one to get started!
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
