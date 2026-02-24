"use client";

import React from "react";
import Link from "next/link";
import { colors } from "@/lib/constants/colors";

export default function ContactPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.backgroundDark }}>
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1
          className="text-4xl font-bold mb-8"
          style={{ color: colors.textPrimary }}
        >
          Contact
        </h1>
        <div
          className="rounded-lg p-8"
          style={{
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
          }}
        >
          <p className="text-lg mb-6" style={{ color: colors.textSecondary }}>
            We&apos;d love to hear from you. Reach out to us using the
            information below.
          </p>

          <div className="space-y-4">
            <div>
              <h2
                className="text-lg font-semibold mb-1"
                style={{ color: colors.textPrimary }}
              >
                Email
              </h2>
              <div className="space-y-2">
                <a
                  href="mailto:support@pauv.com"
                  className="block hover:underline"
                  style={{ color: colors.gold }}
                >
                  support@pauv.com
                </a>
                <a
                  href="mailto:legal@pauv.com"
                  className="block hover:underline"
                  style={{ color: colors.gold }}
                >
                  legal@pauv.com
                </a>
                <a
                  href="mailto:media@pauv.com"
                  className="block hover:underline"
                  style={{ color: colors.gold }}
                >
                  media@pauv.com
                </a>
              </div>
            </div>

            <div>
              <h2
                className="text-lg font-semibold mb-1"
                style={{ color: colors.textPrimary }}
              >
                Mailing Address
              </h2>
              <p style={{ color: colors.textSecondary }}>
                5206 Regency Cv
                <br />
                Austin, TX 78724
              </p>
            </div>

            <div className="pt-4">
              <Link
                href="/contact/careers"
                className="inline-block text-lg font-semibold hover:underline transition-colors"
                style={{ color: colors.gold }}
              >
                We&apos;re hiring → Careers
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
