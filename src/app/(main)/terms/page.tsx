"use client";

import React from "react";
import Image from "next/image";
import { colors } from "@/lib/constants/colors";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.backgroundDark }}>
      <main className="max-w-4xl mx-auto px-6 py-16 space-y-6">
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
          <h1
            className="text-4xl font-bold"
            style={{ color: colors.textPrimary }}
          >
            Terms of Service
          </h1>
        </div>
        <div className="space-y-6">
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Last Updated: March 08, 2026
          </p>

          <div className="space-y-4" style={{ color: colors.textPrimary }}>
            <p className="font-semibold">
              IMPORTANT NOTICE: PLEASE READ CAREFULLY.
            </p>
            <p className="font-semibold">
              THESE TERMS CONTAIN A BINDING ARBITRATION PROVISION AND CLASS ACTION WAIVER.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>1. Acceptance of Terms</h2>
            <p style={{ color: colors.textSecondary }}>
              By creating an account, accessing, or using the website located at pauv.com (the "Platform"),
              you agree to be bound by these Terms of Service ("Terms"). These Terms constitute a legal
              agreement between you and Pauv Inc., a Delaware corporation with its principal place of business
              in Austin, Texas ("Pauv," "we," "us," or "our"). If you do not agree to these Terms, you must
              not use the Platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>2. Eligibility</h2>
            <p style={{ color: colors.textSecondary }}>
              <span className="font-semibold" style={{ color: colors.textPrimary }}>General Users (Traders):</span>{" "}
              To create an account to buy, sell, or hold USDP and PVs, you must be at least 18 years old,
              a resident of the United States, and pass all required identity verification (KYC) checks.
            </p>
            <p style={{ color: colors.textSecondary }}>
              <span className="font-semibold" style={{ color: colors.textPrimary }}>Talent:</span>{" "}
              An individual under the age of 18 ("Minor") may be listed as Talent on the Platform only if
              a parent or legal guardian ("Guardian") creates and manages the account on their behalf. The
              Guardian accepts full legal responsibility for the Minor's participation and agrees to these Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>3. The Pauv Platform &amp; Services</h2>
            <p style={{ color: colors.textSecondary }}>
              Pauv is the world's first marketplace for human potential. We provide a digital marketplace
              that allows users to open a position on public sentiment by acquiring digital collectibles
              known as "Personal Value" units (PVs).
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Nature of the Platform:</span> Pauv is a closed-loop entertainment and collectible platform. It is not a stock exchange, a securities exchange, or a bank.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Nature of PVs:</span> PVs are digital collectibles tracked on a private, hybrid ledger. PVs represent public perception and sentiment; they do not represent equity, ownership in a person, rights to future income, voting rights, or a debt owed by any Talent.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Supply:</span> Pauv does not guarantee a fixed or capped supply of PVs. New PVs are minted and issued dynamically via an algorithmic pricing curve as users purchase them.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>4. USDP Credits &amp; Fiat Transactions</h2>
            <p style={{ color: colors.textSecondary }}>
              To acquire PVs, users must first obtain USDP, our internal platform credit.
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Definition:</span> USDP is a non-transferable, closed-loop ledger credit used solely to facilitate transactions within the Pauv Platform. 1 USDP is equivalent to $1 USD. USDP is not a cryptocurrency.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Custodial FBO Accounts:</span> When you load funds via our payment partners (Finix and Soap Payments), your USD is held securely in a "For Benefit Of" (FBO) custodial account via BVNK at Lead Bank. Pauv does not commingle user funds with corporate operational funds.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Withdrawals (Redemption):</span> You may withdraw your USDP for USD at a 1:1 ratio at any time. To protect against fraud and comply with Anti-Money Laundering (AML) laws, all withdrawal requests are subject to a standard 1-to-2 business day ledger-to-blockchain reconciliation period before funds are remitted to your linked bank account.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>No Transfers:</span> You may not sell, gift, transfer, or trade USDP or PVs to other users directly. Peer-to-peer transfers are strictly disabled.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>5. Account Registration, KYC, &amp; Security</h2>
            <p style={{ color: colors.textSecondary }}>
              Pauv is a registered Money Services Business (MSB) with FinCEN. To comply with the Bank
              Secrecy Act (BSA) and Anti-Money Laundering (AML) laws:
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Verification:</span> We, via our partner Soap Payments, require identity verification (KYC/KYB) to open and maintain an account. You must provide accurate, current, and complete information.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Monitoring:</span> We actively monitor transactions for fraud, wash trading, and illicit activity. We reserve the right to suspend accounts, delay withdrawals, or report activity to regulatory authorities if we detect suspicious behavior.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Security:</span> You are responsible for maintaining the confidentiality of your login credentials. You accept responsibility for all activities that occur under your account.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>6. Trading PVs (Algorithmic Pricing)</h2>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Platform as Counterparty:</span> All trades are executed directly against the Platform. You are buying from and selling to Pauv Inc., not directly to other users. Shorting is not allowed.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Linear Pricing Model:</span> PV prices are determined by a transparent, continuous linear growth formula. Each PV begins at $0.01. Every single PV bought or sold changes the price by exactly $0.000001. All Talents use this identical formula to ensure constant liquidity.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Price Volatility:</span> Because price is mathematically tied to the number of units bought and sold, the price can be highly volatile. If many users sell at once, the value of your PVs could drop significantly.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Transaction Fees:</span> A transaction fee of 0.50% total (0.25% to the Talent, 0.25% to Pauv) is deducted from every buy or sell order.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>7. Talent Terms (For Public Figures &amp; Creators)</h2>
            <p style={{ color: colors.textSecondary }}>
              If you list yourself (or your Minor ward) as "Talent" on Pauv:
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Grant of Rights:</span> You grant Pauv Inc. a non-exclusive, worldwide, royalty-free license to use the name, image, likeness, and username provided for the purpose of identifying the PVs and marketing the Platform.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Compensation:</span> Talent earns continuous income derived from market demand. Talents receive a 0.25% Royalty of all transaction volume for their PV. Additionally, Talents receive ongoing Royalty payments from the Talent Fund equivalent to 1% annually of the USDP in their PV market capitalization (calculated via Average Daily Balance). These Royalties are deposited monthly as USD to the Talent's linked bank account.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>No Fiduciary Duty:</span> Listing on Pauv does not create a fiduciary relationship between the Talent and PV holders. The Talent does not owe PV holders any financial returns, performance obligations, or special treatment.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>8. Prohibited Conduct</h2>
            <p style={{ color: colors.textSecondary }}>
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li>Use the Platform for money laundering, terrorist financing, or other illegal activities.</li>
              <li>Use bots, spiders, or automated scripts to interact with the Platform.</li>
              <li>Engage in market manipulation, wash trading, or coordinated schemes to artificially inflate PV prices.</li>
              <li>Attempt to sell USDP or PVs outside of the Platform (e.g., selling your account on third-party sites).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>9. Risk Disclosure &amp; Disclaimers</h2>
            <p className="font-semibold" style={{ color: colors.textPrimary }}>
              YOU ACKNOWLEDGE THAT TRADING PVS INVOLVES SIGNIFICANT RISK.
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Not an Investment:</span> PVs should be treated as digital collectibles used to back the public perception of rising talent. They are strictly for entertainment and engagement purposes. Pauv does not provide financial or tax advice.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Loss of Value:</span> The value of a PV can drop. You should not purchase USDP with funds you cannot afford to lose.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Float Retained by Platform:</span> Funds held in the Lead Bank FBO custodial accounts may earn interest. You acknowledge and agree that any such interest or earnings ("float") are the sole property of Pauv Inc., and you have no claim to these earnings.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>&quot;As Is&quot; Service:</span> The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>10. Limitation of Liability</h2>
            <p style={{ color: colors.textSecondary }}>
              To the maximum extent permitted by law, Pauv Inc. and its affiliates, banking partners, and
              payment processors shall not be liable for any indirect, incidental, special, consequential,
              or punitive damages, or any loss of profits or revenues. In no event shall Pauv's aggregate
              liability exceed the amount you paid to Pauv in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>11. Termination</h2>
            <p style={{ color: colors.textSecondary }}>
              Pauv reserves the right to suspend or terminate your account at our sole discretion, without
              notice, for conduct that we believe violates these Terms, violates AML/BSA regulations, is
              harmful to other users, or for any other reason.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>12. Governing Law &amp; Dispute Resolution</h2>
            <p style={{ color: colors.textSecondary }}>
              These Terms shall be governed by and construed in accordance with the laws of the State of Texas,
              without regard to its conflict of law principles. Any dispute arising from or relating to these
              Terms or your use of the Platform shall be resolved by binding arbitration in Austin, Texas.
              You waive your right to participate in a class action lawsuit or class-wide arbitration.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
