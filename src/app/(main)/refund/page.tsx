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
            src="https://iframe.mediadelivery.net/embed/579822/a063c464-ce61-4730-a4ec-0662b94ca81c?autoplay=true&loop=false&muted=false&preload=true&responsive=true"
            loading="lazy"
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
              Refund Policy (Phase 1)
            </h1>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Last Updated: February 18, 2026
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            No "Change of Mind" Refunds
          </h2>
          <p style={{ color: colors.textSecondary }}>
            Due to the nature of the Pauv Platform as a closed-loop system during Phase 1,
            all purchases of USDP credits are final and non-refundable.
          </p>
          <p style={{ color: colors.textSecondary }}>We do not offer refunds for:</p>
          <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
            <li>Changing your mind after purchasing USDP.</li>
            <li>Poor performance of PVs (i.e., if the "value" of a person drops).</li>
            <li>Inability to withdraw funds (as clearly disclosed in our Terms of Service).</li>
            <li>Dissatisfaction with the Platform features.</li>
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
            Pauv Inc. may, at its sole discretion, process a refund only in the following
            specific scenarios ("Bona Fide Errors"):
          </p>
          <ol className="list-decimal pl-6 space-y-2" style={{ color: colors.textSecondary }}>
            <li>
              <span className="font-semibold" style={{ color: colors.textPrimary }}>
                Technical Duplication:
              </span>{" "}
              If a technical error causes your payment method to be charged twice for a single transaction.
            </li>
            <li>
              <span className="font-semibold" style={{ color: colors.textPrimary }}>
                Unauthorized Activity:
              </span>{" "}
              If we verify that the charge was made due to fraudulent use of your credit card
              or bank account (subject to investigation).
            </li>
            <li>
              <span className="font-semibold" style={{ color: colors.textPrimary }}>
                Failure to Deliver:
              </span>{" "}
              If you were charged but the corresponding USDP credits were never delivered to your Pauv account
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
            To request a refund for a Bona Fide Error, you must contact support@pauv.com within
            7 days of the transaction. You must include:
          </p>
          <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
            <li>Your username.</li>
            <li>Transaction ID/Date.</li>
            <li>Evidence of the error (e.g., screenshot of double charge).</li>
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
            Initiating a chargeback with your bank or credit card issuer without first
            contacting Pauv support will result in the immediate and permanent suspension
            of your Pauv account.
          </p>
        </section>
      </main>
    </div>
  );
}
