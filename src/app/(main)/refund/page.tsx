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
              Last Updated: February 2026
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            1. No Refunds on Digital Credits (USDP)
          </h2>
          <p style={{ color: colors.textSecondary }}>
            All purchases of USDP (platform credits) are final and
            non-refundable. Because USDP is delivered instantly to your digital
            account and is immediately available for use within the Pauv
            ecosystem, the service is considered "fully performed" at the
            moment of delivery. By completing a purchase, you acknowledge and
            agree that you waive any statutory right to a "cooling-off" period
            or right of withdrawal.
          </p>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            2. Finality of Community Exchanges (PVs)
          </h2>
          <p style={{ color: colors.textSecondary }}>
            All peer-to-peer exchanges of PVs (digital collectibles) are
            executed through an automated ledger. These transactions are final,
            irreversible, and non-refundable. Pauv Inc. does not act as a
            counterparty in these exchanges and cannot reverse or refund
            transactions between users.
          </p>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            3. Billing Statements &amp; Unrecognized Charges
          </h2>
          <p style={{ color: colors.textSecondary }}>
            Charges on your bank or credit card statement will appear as
            "PAUV INC" or "PAUV.COM". To prevent unnecessary disputes, please
            ensure you recognize this billing descriptor. If you do not
            recognize a charge, you must contact support@pauv.com immediately
            before contacting your bank.
          </p>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            4. Chargebacks and Account Forfeiture
          </h2>
          <p style={{ color: colors.textSecondary }}>
            Pauv Inc. maintains a zero-tolerance policy for "Friendly Fraud." If
            you initiate a chargeback for a legitimate transaction that you
            authorized, Pauv Inc. reserves the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
            <li>Permanently terminate your account access.</li>
            <li>
              Forfeit all remaining USDP and PVs in your account without
              compensation.
            </li>
            <li>
              Submit transaction logs, including your IP address and device ID,
              to your bank to contest the dispute.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            5. Exceptional Billing Errors
          </h2>
          <p style={{ color: colors.textSecondary }}>
            If you believe there has been a technical billing error (e.g.,
            duplicate charges or a failed USDP delivery), you must notify us at
            support@pauv.com within 24 hours of the transaction. We review all
            requests manually and, at our sole discretion, may issue a credit or
            refund if a verifiable system error occurred.
          </p>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            6. Closed-Loop Limitation
          </h2>
          <p style={{ color: colors.textSecondary }}>
            As stated in our Terms of Service, USDP and PVs are digital goods
            for use exclusively within the Pauv platform. They have no inherent
            cash value and cannot be withdrawn, cashed out, or refunded for
            traditional currency.
          </p>
        </section>
      </main>
    </div>
  );
}
