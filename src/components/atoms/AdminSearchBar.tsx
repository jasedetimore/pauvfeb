"use client";

import React, { useState, useEffect, useRef } from "react";
import { colors } from "@/lib/constants/colors";

interface AdminSearchBarProps {
  /** Callback fired with the debounced search value */
  onSearch: (query: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in ms (default 300) */
  debounceMs?: number;
}

/**
 * AdminSearchBar – graceful debounced search by name/ticker.
 * Fires onSearch after the user stops typing for `debounceMs` milliseconds.
 */
export function AdminSearchBar({
  onSearch,
  placeholder = "Search by name or ticker…",
  debounceMs = 300,
}: AdminSearchBarProps) {
  const [value, setValue] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      onSearchRef.current(value.trim());
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, debounceMs]);

  return (
    <div className="relative mb-4">
      {/* Search icon */}
      <div
        className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
        style={{ color: colors.textMuted }}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors"
        style={{
          backgroundColor: colors.box,
          borderColor: colors.boxOutline,
          color: colors.textPrimary,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ["--tw-ring-color" as any]: colors.gold,
        }}
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute inset-y-0 right-0 flex items-center pr-3 transition-opacity hover:opacity-70"
          style={{ color: colors.textMuted }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
