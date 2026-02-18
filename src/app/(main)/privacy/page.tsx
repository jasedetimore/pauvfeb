"use client";

import React from "react";
import Image from "next/image";
import { colors } from "@/lib/constants/colors";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <main
        className="max-w-4xl mx-auto px-6 py-16 space-y-10"
        style={{ fontFamily: "var(--font-fira-code)" }}
      >
        <div className="flex flex-col gap-6">
          <Image
            src="/pauv_logo_gold.png"
            alt="Pauv"
            width={140}
            height={48}
            className="object-contain"
          />
          <div className="space-y-2">
            <h1
              className="text-4xl font-semibold"
              style={{ color: colors.textPrimary }}
            >
              Privacy Policy
            </h1>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Last Updated: February 2026
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            1. Information We Collect
          </h2>
          <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
            <li>
              Voluntary Data: Name, email address, and profile details provided
              during account creation.
            </li>
            <li>
              Automatic Data: IP address, device identifiers, and browser type
              collected via cookies and similar technologies to ensure platform
              security.
            </li>
            <li>
              Transaction Data: History of USDP purchases and PV community
              exchanges.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            2. Third-Party Service Providers (Soap)
          </h2>
          <p style={{ color: colors.textSecondary }}>
            Pauv uses Soap for payment processing and identity verification. We
            do not store credit card numbers on our servers. Soap uses and
            processes your data according to their own privacy policy to
            facilitate payments and prevent fraudulent transactions.
          </p>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            3. Your Rights &amp; Choices (Texas TDPSA Compliance)
          </h2>
          <p style={{ color: colors.textSecondary }}>
            As a user, you have the following rights regarding your personal
            information:
          </p>
          <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
            <li>Right to Access: Request a copy of the data we hold about you.</li>
            <li>Right to Correction: Request that we fix inaccurate information.</li>
            <li>
              Right to Deletion: Request that we delete your account and
              associated personal data.
            </li>
          </ul>
          <p style={{ color: colors.textSecondary }}>
            To exercise these rights, contact support@pauv.com. We will respond
            to all authenticated requests within 45 days.
          </p>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            4. Data Security &amp; Retention
          </h2>
          <p style={{ color: colors.textSecondary }}>
            We implement industry-standard encryption to protect your data. We
            retain personal information only as long as necessary to provide our
            services and comply with legal obligations (such as tax and
            financial reporting).
          </p>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            5. Children&apos;s Privacy
          </h2>
          <p style={{ color: colors.textSecondary }}>
            Pauv is not intended for children under the age of 13. If we
            discover that a child under 13 has provided us with personal
            information, we will delete it immediately.
          </p>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            6. Changes to This Policy
          </h2>
          <p style={{ color: colors.textSecondary }}>
            We may update this policy periodically. We will notify you of any
            significant changes by posting the new policy on this page and
            updating the "Last Updated" date.
          </p>
        </section>
      </main>
    </div>
  );
}
