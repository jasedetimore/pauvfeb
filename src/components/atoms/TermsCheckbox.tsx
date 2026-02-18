"use client";

import React from "react";
import Link from "next/link";
import { colors } from "@/lib/constants/colors";

interface TermsCheckboxProps {
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Callback when the checkbox value changes */
  onChange: (checked: boolean) => void;
  /** 
   * Variant controls the wording:
   * - "signup" : standard Terms & Privacy for account creation
   * - "issuer" : adds Issuer Terms language
   */
  variant?: "signup" | "issuer";
  /** Optional id for the checkbox input */
  id?: string;
}

/**
 * Reusable terms-and-conditions checkbox.
 * Links open in a new tab so the user doesn't lose form state.
 */
export function TermsCheckbox({
  checked,
  onChange,
  variant = "signup",
  id = "terms-checkbox",
}: TermsCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 cursor-pointer select-none group"
    >
      {/* Custom styled checkbox */}
      <span className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <span
          className="block w-5 h-5 rounded border-2 transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1"
          style={{
            borderColor: checked ? colors.gold : colors.boxOutline,
            backgroundColor: checked ? colors.gold : "transparent",
            // @ts-expect-error CSS custom properties
            "--tw-ring-color": colors.gold,
            "--tw-ring-offset-color": colors.background,
          }}
        >
          {/* Check icon */}
          {checked && (
            <svg
              className="w-full h-full"
              viewBox="0 0 20 20"
              fill="none"
              stroke={colors.textDark}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="5 10 9 14 15 6" />
            </svg>
          )}
        </span>
      </span>

      {/* Label text */}
      <span className="text-sm leading-snug" style={{ color: colors.textSecondary }}>
        I agree to the{" "}
        <Link
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:no-underline transition-colors"
          style={{ color: colors.gold }}
          onClick={(e) => e.stopPropagation()}
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:no-underline transition-colors"
          style={{ color: colors.gold }}
          onClick={(e) => e.stopPropagation()}
        >
          Privacy Policy
        </Link>
        {variant === "issuer" && (
          <>
            , including the{" "}
            <Link
              href="/terms#issuer-terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline transition-colors"
              style={{ color: colors.gold }}
              onClick={(e) => e.stopPropagation()}
            >
              Issuer Terms
            </Link>
          </>
        )}
        .
      </span>
    </label>
  );
}
