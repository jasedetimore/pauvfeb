"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { colors } from "@/lib/constants/colors";

const AboutFooter = () => {
  return (
    <footer
      className="py-12"
      style={{
        backgroundColor: colors.background,
        borderTop: `1px solid ${colors.gold}1A`,
      }}
    >
      <div className="container mx-auto px-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <Image
              src="/pauv_logo_gold.png"
              alt="Pauv Inc."
              width={120}
              height={32}
              className="h-8 w-auto"
            />
            <p
              className="text-sm leading-relaxed"
              style={{ color: `${colors.textPrimary}99` }}
            >
              Unlocking the value of the creator economy.
            </p>
          </div>

          {/* Column 2: Company */}
          <div className="space-y-4">
            <h4
              className="font-semibold text-sm uppercase tracking-wider"
              style={{ color: colors.textPrimary }}
            >
              Company
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="transition-colors"
                  style={{ color: `${colors.textPrimary}80` }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = colors.gold;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = `${colors.textPrimary}80`;
                  }}
                >
                  About Us
                </Link>
              </li>
              <li>
                <a
                  href="#waitlist"
                  className="transition-colors"
                  style={{ color: `${colors.textPrimary}80` }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = colors.gold;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = `${colors.textPrimary}80`;
                  }}
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <nav className="space-y-4" aria-label="Legal">
            <h4
              className="font-semibold text-sm uppercase tracking-wider"
              style={{ color: colors.textPrimary }}
            >
              Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="transition-colors"
                  style={{ color: `${colors.textPrimary}80` }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = colors.gold;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = `${colors.textPrimary}80`;
                  }}
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors"
                  style={{ color: `${colors.textPrimary}80` }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = colors.gold;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = `${colors.textPrimary}80`;
                  }}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/refunds"
                  className="transition-colors"
                  style={{ color: `${colors.textPrimary}80` }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = colors.gold;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = `${colors.textPrimary}80`;
                  }}
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </nav>

          {/* Column 4: Contact Info */}
          <div className="space-y-4">
            <h4
              className="font-semibold text-sm uppercase tracking-wider"
              style={{ color: colors.textPrimary }}
            >
              Contact Info
            </h4>
            <div
              className="space-y-2 text-sm"
              style={{ color: `${colors.textPrimary}80` }}
            >
              <p className="leading-relaxed">
                5206 Regency Cv
                <br />
                Austin, TX 78724
              </p>
              <p>
                <a
                  href="mailto:support@pauv.com"
                  className="transition-colors"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = colors.gold;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = `${colors.textPrimary}80`;
                  }}
                >
                  support@pauv.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="pt-8"
          style={{ borderTop: `1px solid ${colors.gold}1A` }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p
              className="text-sm"
              style={{ color: `${colors.textPrimary}4D` }}
            >
              © 2026 Pauv Inc.
            </p>
            <p
              className="text-xs text-center md:text-right max-w-xl"
              style={{ color: `${colors.textPrimary}4D` }}
            >
              USDP are platform-specific credits with no cash value. PVs are
              digital collectibles and do not represent ownership in any person
              or entity.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AboutFooter;
