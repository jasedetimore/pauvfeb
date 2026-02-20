"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { colors } from "@/lib/constants/colors";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

/**
 * PrimaryButton — A gold-branded action button using colors.ts.
 * Used for primary CTAs (e.g., claim account, submit forms).
 */
export function PrimaryButton({
  children,
  isLoading = false,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-md
        font-semibold font-mono text-sm
        px-6 py-3
        transition-all duration-200
        hover:scale-[1.02] active:scale-[0.98]
        hover:shadow-[0_0_15px_rgba(229,198,141,0.3)]
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      style={{
        backgroundColor: disabled || isLoading ? colors.boxLight : colors.gold,
        color: colors.textDark,
        borderColor: colors.goldBorder,
        // Focus ring offset uses background color
        // @ts-expect-error CSS custom property for focus ring
        "--tw-ring-color": colors.gold,
        "--tw-ring-offset-color": colors.background,
      }}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
