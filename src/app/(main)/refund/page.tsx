"use client";

import React from "react";
import Image from "next/image";
import { colors } from "@/lib/constants/colors";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <main
        className="max-w-4xl mx-auto px-6 py-16 space-y-10"
        style={{ fontFamily: "var(--font-fira-code)" }}
      >
        <div style={{ position: "relative", paddingTop: "56.25%" }}>
          <iframe
            src="https://iframe.mediadelivery.net/embed/579822/a063c464-ce61-4730-a4ec-0662b94ca81c?autoplay=true&loop=false&muted=true&preload=true&responsive=true"
            loading="eager"
            style={{
              border: 0,
              position: "absolute",
              top: 0,
              height: "100%",
              width: "100%",
            }}
            allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
            allowFullScreen
          />
        </div>

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
              Refund Policy
            </h1>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Last Updated: March 08, 2026
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            Withdrawals vs. Refunds
          </h2>
          <p style={{ color: colors.textSecondary }}>
            Pauv is a fully liquid, closed-loop platform. Because you have the ability to sell your
            PVs at the current algorithmic market price and withdraw your USDP balance to your linked
            bank account at any time, Pauv does not offer traditional &quot;refunds&quot; for platform activity
            or market-driven losses.
          </p>
          <p style={{ color: colors.textSecondary }}>
            If you wish to retrieve your funds, you may simply trade your PVs back for USDP and
            initiate a withdrawal via the Platform interface.
          </p>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            No "Change of Mind" Refunds
          </h2>
          <p style={{ color: colors.textSecondary }}>
            We do not offer refunds or transaction reversals for:
          </p>
          <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
            <li>Changing your mind after opening a position on a Talent's sentiment.</li>
            <li>Poor performance or dropping market demand of a Talent's PV.</li>
            <li>Dissatisfaction with the Platform features.</li>
            <li>Standard withdrawal processing times (1 to 2 business days for ledger-to-blockchain reconciliation).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            Exceptions (Bona Fide Errors)
          </h2>
          <p style={{ color: colors.textSecondary }}>
            Pauv Inc. may, at its sole discretion, process a direct refund to your payment method
            only in the following specific scenarios ("Bona Fide Errors"):
          </p>
          <ol className="list-decimal pl-6 space-y-2" style={{ color: colors.textSecondary }}>
            <li>
              <span className="font-semibold" style={{ color: colors.textPrimary }}>
                Technical Duplication:
              </span>{" "}
              If a technical error causes your payment method to be charged twice for a single USDP
              deposit transaction.
            </li>
            <li>
              <span className="font-semibold" style={{ color: colors.textPrimary }}>
                Unauthorized Activity:
              </span>{" "}
              If we verify that a deposit was made due to fraudulent use of your credit card
              or bank account (subject to a formal AML/fraud investigation).
            </li>
            <li>
              <span className="font-semibold" style={{ color: colors.textPrimary }}>
                Failure to Deliver:
              </span>{" "}
              If you were charged but the corresponding USDP credits were never delivered to your Pauv wallet
              due to a system failure.
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            How to Request a Refund for an Error
          </h2>
          <p style={{ color: colors.textSecondary }}>
            To request a refund for a Bona Fide Error, you must contact support@pauv.com within 7
            days of the transaction. You must include:
          </p>
          <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
            <li>Your username.</li>
            <li>Transaction ID and Date.</li>
            <li>Evidence of the error (e.g., screenshot of a double bank charge).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            Chargebacks
          </h2>
          <p style={{ color: colors.textSecondary }}>
            Initiating a chargeback with your bank or credit card issuer without first contacting
            Pauv support constitutes a violation of our Terms of Service. Because USDP and PVs are
            digital assets, unwarranted chargebacks are treated as friendly fraud. Initiating an
            unjustified chargeback will result in the immediate and permanent suspension of your
            Pauv account, and we may report the incident to our payment partners.
          </p>
        </section>
      </main>
    </div>
  );
}
