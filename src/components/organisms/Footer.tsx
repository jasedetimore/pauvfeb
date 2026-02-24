"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { colors } from "@/lib/constants/colors";

/**
 * Footer - Site-wide footer with 4 columns and bottom bar
 * Column 1: Logo + tagline
 * Column 2: Company links
 * Column 3: Legal links
 * Column 4: Contact info
 */
export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: colors.background,
        borderTop: `1px solid ${colors.border}`,
      }}
    >
      <div className="w-full px-10 py-12">
        {/* Four columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Logo + Tagline */}
          <div className="flex flex-col gap-4">
            <Link href="/">
              <Image
                src="/pauv_logo_gold.png"
                alt="Pauv"
                width={120}
                height={40}
                className="object-contain"
              />
            </Link>
            <p
              className="text-sm leading-relaxed"
              style={{ color: colors.textSecondary }}
            >
              Unlocking the value of the creator economy.
            </p>
          </div>

          {/* Column 2: Company */}
          <div className="flex flex-col gap-3">
            <h3
              className="font-semibold text-sm uppercase tracking-wider"
              style={{ color: colors.textPrimary }}
            >
              Company
            </h3>
            <Link
              href="/about"
              className="text-sm hover:underline transition-colors"
              style={{ color: colors.textSecondary }}
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="text-sm hover:underline transition-colors"
              style={{ color: colors.textSecondary }}
            >
              Contact
            </Link>
            <Link
              href="/contact/careers"
              className="text-sm hover:underline transition-colors"
              style={{ color: colors.textSecondary }}
            >
              Careers
            </Link>
          </div>

          {/* Column 3: Legal */}
          <div className="flex flex-col gap-3">
            <h3
              className="font-semibold text-sm uppercase tracking-wider"
              style={{ color: colors.textPrimary }}
            >
              Legal
            </h3>
            <Link
              href="/terms"
              className="text-sm hover:underline transition-colors"
              style={{ color: colors.textSecondary }}
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-sm hover:underline transition-colors"
              style={{ color: colors.textSecondary }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/refund"
              className="text-sm hover:underline transition-colors"
              style={{ color: colors.textSecondary }}
            >
              Refund Policy
            </Link>
          </div>

          {/* Column 4: Contact Info */}
          <div className="flex flex-col gap-3">
            <h3
              className="font-semibold text-sm uppercase tracking-wider"
              style={{ color: colors.textPrimary }}
            >
              Contact Info
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              5206 Regency Cv
            </p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Austin, TX 78724
            </p>
            <a
              href="mailto:support@pauv.com"
              className="text-sm hover:underline transition-colors"
              style={{ color: colors.textSecondary }}
            >
              support@pauv.com
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ borderTop: `1px solid ${colors.border}` }}
        >
          <p className="text-xs" style={{ color: colors.textMuted }}>
            &copy; 2026 Pauv Inc.
          </p>
          <small
            className="text-xs max-w-xl text-right block"
            style={{ color: colors.textMuted }}
          >
            USDP are platform-specific credits with no cash value. PVs are
            digital collectibles and do not represent ownership in any person or
            entity.
          </small>
        </div>
      </div>
    </footer>
  );
}
