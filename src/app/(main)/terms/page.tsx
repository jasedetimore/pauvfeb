"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.backgroundDark }}>
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1
          className="text-4xl font-bold mb-8"
          style={{ color: colors.textPrimary }}
        >
          Terms of Service
        </h1>
        <div
          className="rounded-lg p-8 space-y-6"
          style={{
            backgroundColor: colors.box,
            border: `1px solid ${colors.border}`,
          }}
        >
          <p style={{ color: colors.textSecondary }}>
            Content coming soon.
          </p>
        </div>
      </main>
    </div>
  );
}
