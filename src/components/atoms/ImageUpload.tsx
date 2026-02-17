"use client";

import React, { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { colors } from "@/lib/constants/colors";
import { createClient } from "@/lib/supabase/client";

// ── Crop utility ────────────────────────────────────────────────
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (err) => reject(err));
    img.crossOrigin = "anonymous";
    img.src = url;
  });
}

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  outputType = "image/jpeg"
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))),
      outputType,
      0.92
    );
  });
}

// ── Types ───────────────────────────────────────────────────────
export interface ImageUploadProps {
  /** Current image URL (for preview of already-uploaded images) */
  value: string;
  /** Called with the public URL after successful upload, or "" on clear */
  onChange: (url: string) => void;
  /** Storage folder path, e.g. "issuers" or "tags" */
  folder?: string;
  /** Label text above the drop zone */
  label?: string;
  /** Whether the upload is disabled */
  disabled?: boolean;
  /** Aspect ratio for cropping (width / height). e.g. 1 for square, 4 for 10:2.5 banner */
  aspectRatio?: number;
  /** API endpoint used for file upload */
  uploadEndpoint?: string;
}

// ── Component ───────────────────────────────────────────────────
export function ImageUpload({
  value,
  onChange,
  folder = "general",
  label = "Photo",
  disabled = false,
  aspectRatio,
  uploadEndpoint = "/api/admin/upload",
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const pendingFileRef = useRef<File | null>(null);

  const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  const maxSizeMB = 10;

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed: PNG, JPG, WebP, GIF`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: ${maxSizeMB}MB`;
    }
    return null;
  };

  // Upload a blob/file to the API
  const doUpload = useCallback(
    async (blob: Blob, originalName: string) => {
      setError(null);
      setUploading(true);

      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("Not authenticated");
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Not authenticated");
        }

        const file = new File([blob], originalName, { type: blob.type });
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch(uploadEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        });

        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error || "Upload failed");
        }

        onChange(json.data.publicUrl);
        setPreviewUrl(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setPreviewUrl(null);
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange, uploadEndpoint]
  );

  // Handle a selected file — either open cropper or upload directly
  const processFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);

      if (aspectRatio) {
        // Open crop modal
        pendingFileRef.current = file;
        const objectUrl = URL.createObjectURL(file);
        setCropSrc(objectUrl);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
      } else {
        // No cropping — upload directly
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);
        doUpload(file, file.name).finally(() => URL.revokeObjectURL(localPreview));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [aspectRatio, doUpload]
  );

  // Crop complete callback (from react-easy-crop)
  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // Confirm crop → produce cropped blob → upload
  const handleCropConfirm = useCallback(async () => {
    if (!cropSrc || !croppedAreaPixels || !pendingFileRef.current) return;

    const originalFile = pendingFileRef.current;
    const outputType = originalFile.type === "image/png" ? "image/png" : "image/jpeg";

    try {
      const croppedBlob = await getCroppedBlob(cropSrc, croppedAreaPixels, outputType);

      // Show local preview of cropped result
      const localPreview = URL.createObjectURL(croppedBlob);
      setPreviewUrl(localPreview);

      // Close crop modal
      URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
      pendingFileRef.current = null;

      // Upload
      await doUpload(croppedBlob, originalFile.name);
      URL.revokeObjectURL(localPreview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crop failed");
      URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
      pendingFileRef.current = null;
    }
  }, [cropSrc, croppedAreaPixels, doUpload]);

  // Cancel crop
  const handleCropCancel = useCallback(() => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    pendingFileRef.current = null;
  }, [cropSrc]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !uploading) {
        setIsDragging(true);
      }
    },
    [disabled, uploading]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || uploading) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [disabled, uploading, processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
      e.target.value = "";
    },
    [processFile]
  );

  const handleClear = useCallback(() => {
    onChange("");
    setPreviewUrl(null);
    setError(null);
  }, [onChange]);

  const handleClick = useCallback(() => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploading]);

  const displayUrl = previewUrl || value;

  // Descriptive ratio label
  const ratioLabel = aspectRatio
    ? aspectRatio === 1
      ? "Square (1 : 1)"
      : `${aspectRatio > 1 ? aspectRatio : 1} : ${aspectRatio > 1 ? 1 : Math.round(1 / aspectRatio)}`
    : null;

  return (
    <div>
      <label
        className="block text-sm font-medium mb-1"
        style={{ color: colors.textSecondary }}
      >
        {label}
        {ratioLabel && (
          <span className="ml-2 font-normal text-xs" style={{ color: colors.textMuted }}>
            ({ratioLabel})
          </span>
        )}
      </label>

      {/* ── Crop Modal ──────────────────────────────────────── */}
      {cropSrc && aspectRatio && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
        >
          <div
            className="relative w-full max-w-lg mx-4 rounded-lg overflow-hidden"
            style={{
              backgroundColor: colors.box,
              border: `1px solid ${colors.boxOutline}`,
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: `1px solid ${colors.boxOutline}` }}
            >
              <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                Crop Image
                {ratioLabel && (
                  <span className="ml-2 font-normal text-xs" style={{ color: colors.textMuted }}>
                    {ratioLabel}
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={handleCropCancel}
                className="text-lg leading-none px-2 hover:opacity-70 transition-opacity"
                style={{ color: colors.textSecondary }}
              >
                ✕
              </button>
            </div>

            {/* Crop area */}
            <div className="relative" style={{ height: 360 }}>
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: { backgroundColor: colors.backgroundDark },
                }}
              />
            </div>

            {/* Zoom slider */}
            <div
              className="px-4 py-3 flex items-center gap-3"
              style={{ borderTop: `1px solid ${colors.boxOutline}` }}
            >
              <span className="text-xs whitespace-nowrap" style={{ color: colors.textSecondary }}>
                Zoom
              </span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-amber-400"
                style={{ accentColor: colors.gold }}
              />
              <span className="text-xs w-10 text-right tabular-nums" style={{ color: colors.textMuted }}>
                {zoom.toFixed(1)}x
              </span>
            </div>

            {/* Actions */}
            <div
              className="px-4 py-3 flex justify-end gap-2"
              style={{ borderTop: `1px solid ${colors.boxOutline}` }}
            >
              <button
                type="button"
                onClick={handleCropCancel}
                className="px-4 py-2 rounded text-sm transition-colors hover:opacity-80"
                style={{
                  backgroundColor: colors.boxLight,
                  color: colors.textSecondary,
                  border: `1px solid ${colors.boxOutline}`,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                disabled={!croppedAreaPixels}
                className="px-4 py-2 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: colors.gold,
                  color: colors.textDark,
                }}
              >
                Crop & Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Drop Zone ───────────────────────────────────────── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className="relative rounded border-2 border-dashed transition-colors cursor-pointer overflow-hidden"
        style={{
          borderColor: isDragging
            ? colors.gold
            : error
              ? colors.red
              : colors.boxOutline,
          backgroundColor: isDragging ? `${colors.gold}10` : colors.box,
          minHeight: displayUrl ? "auto" : "120px",
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? "none" : "auto",
        }}
      >
        {displayUrl ? (
          <div className="relative group">
            <img
              src={displayUrl}
              alt="Preview"
              className="w-full max-h-48 object-contain rounded"
              style={{ backgroundColor: colors.backgroundDark }}
              onError={() => {
                if (!previewUrl) setError("Failed to load image preview");
              }}
            />
            {/* Overlay on hover */}
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            >
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
                  style={{ backgroundColor: colors.gold, color: colors.textDark }}
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
                  style={{ backgroundColor: colors.red, color: colors.textPrimary }}
                >
                  Remove
                </button>
              </div>
            </div>
            {uploading && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-6 h-6 border-2 rounded-full animate-spin"
                    style={{ borderColor: `${colors.gold}40`, borderTopColor: colors.gold }}
                  />
                  <span className="text-xs font-medium" style={{ color: colors.gold }}>
                    Uploading...
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 px-4">
            {uploading ? (
              <>
                <div
                  className="w-8 h-8 border-2 rounded-full animate-spin mb-2"
                  style={{ borderColor: `${colors.gold}40`, borderTopColor: colors.gold }}
                />
                <span className="text-sm font-medium" style={{ color: colors.gold }}>
                  Uploading...
                </span>
              </>
            ) : (
              <>
                <svg
                  className="w-8 h-8 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke={isDragging ? colors.gold : colors.textMuted}
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: isDragging ? colors.gold : colors.textSecondary }}
                >
                  {isDragging ? "Drop image here" : "Drag & drop an image, or click to browse"}
                </p>
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  PNG, JPG, WebP, GIF — Max {maxSizeMB}MB
                </p>
              </>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(",")}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />
      </div>

      {error && (
        <p className="text-xs mt-1" style={{ color: colors.red }}>
          {error}
        </p>
      )}

      {value && !error && (
        <p
          className="text-xs mt-1 truncate"
          style={{ color: colors.textMuted }}
          title={value}
        >
          {value}
        </p>
      )}
    </div>
  );
}
