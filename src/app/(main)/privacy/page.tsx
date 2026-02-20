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
              Privacy Policy
            </h1>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Last Updated: February 18, 2026
            </p>
          </div>
        </div>

        <p style={{ color: colors.textSecondary }}>
          Pauv Inc. (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy. This Privacy Policy describes
          how we collect, use, and share your personal information when you visit pauv.com (the
          &quot;Platform&quot;) or use our services.
        </p>
        <p style={{ color: colors.textSecondary }}>
          By using the Platform, you agree to the collection and use of information in accordance
          with this policy.
        </p>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            1. Information We Collect
          </h2>
          <p style={{ color: colors.textSecondary }}>
            We collect three categories of information:
          </p>
          <div className="space-y-3">
            <p className="font-semibold" style={{ color: colors.textPrimary }}>
              A. Voluntary Data (Information You Provide)
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li>Account Registration: Name, email address, username, and password.</li>
              <li>Issuer Profile: If you list yourself as an Issuer, we collect the profile image, social media handles, and bio information you choose to display publicly.</li>
              <li>Verification Data: Information required for identity verification, which may include government ID numbers or dates of birth (facilitated via our partner, Soap).</li>
              <li>Support: Information sent to us when you contact customer support.</li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="font-semibold" style={{ color: colors.textPrimary }}>
              B. Automatic Data (Information Collected via Technology)
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li>Device &amp; Usage: IP address, browser type, device type, operating system, and time stamps.</li>
              <li>Activity: Pages viewed, time spent on the Platform, and interactions with the interface.</li>
              <li>Cookies: We use cookies and local storage to maintain your login session and ensure platform security.</li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="font-semibold" style={{ color: colors.textPrimary }}>
              C. Transaction Data
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li>Financial History: Records of USDP credit purchases, PV trades, and account balances.</li>
              <li>Blockchain Records: While our ledger is private/hybrid, transaction metadata (wallet addresses and trade amounts) is recorded immutably on our internal ledger system.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            2. Third-Party Service Providers (Soap Payments)
          </h2>
          <p style={{ color: colors.textSecondary }}>
            We utilize Soap Payments for payment processing and identity verification.
          </p>
          <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
            <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Payment Information:</span> Pauv does not store your full credit card number or bank account details on our servers. This sensitive financial data is transmitted directly to Soap Payments for processing.</li>
            <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Identity Verification:</span> Soap Payments processes your personal data to verify your identity and prevent fraud.</li>
            <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Soap’s Policy:</span> By using our Platform, you acknowledge that your data will be processed by Soap in accordance with their own Privacy Policy. We encourage you to review their policy for details on how they handle financial data.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            3. How We Use Your Information
          </h2>
          <p style={{ color: colors.textSecondary }}>
            We use your data for the following purposes:
          </p>
          <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
            <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Service Delivery:</span> To create your account, process USDP transactions, and execute PV trades using our linear pricing algorithm.</li>
            <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Security &amp; Fraud Prevention:</span> To detect wash trading, market manipulation, account takeovers, and other prohibited activities.</li>
            <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Communication:</span> To send you transaction confirmations, security alerts, and administrative updates.</li>
            <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Legal Compliance:</span> To comply with applicable laws, including tax reporting and responding to lawful requests from government authorities.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            4. Your Rights (Texas TDPSA Compliance)
          </h2>
          <p style={{ color: colors.textSecondary }}>
            Pauv Inc. is headquartered in Texas. Under the Texas Data Privacy and Security Act
            (TDPSA), residents of Texas (and other users, as a courtesy) have the following rights:
          </p>
          <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
            <li>Right to Access: You may request a copy of the specific personal data we maintain about you.</li>
            <li>Right to Correction: You may request that we correct inaccuracies in your personal data.</li>
            <li>Right to Deletion: You may request that we delete personal data you have provided to us (subject to retention required by law for financial records).</li>
            <li>Right to Portability: You may request a copy of your data in a digital, machine-readable format.</li>
            <li>Right to Appeal: If we deny your request, you have the right to appeal our decision.</li>
          </ul>
          <p className="font-semibold" style={{ color: colors.textPrimary }}>
            How to Exercise Your Rights:
          </p>
          <p style={{ color: colors.textSecondary }}>
            To submit a request, please email support@pauv.com. We will authenticate your identity
            before processing the request and will respond within 45 days, as required by law.
          </p>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            5. Data Security &amp; Retention
          </h2>
          <p style={{ color: colors.textSecondary }}>
            <span className="font-semibold" style={{ color: colors.textPrimary }}>Security:</span> We implement
            industry-standard encryption (SSL/TLS) and security protocols to protect your data during
            transmission and storage. However, no method of transmission over the Internet is 100% secure.
          </p>
          <p style={{ color: colors.textSecondary }}>
            <span className="font-semibold" style={{ color: colors.textPrimary }}>Retention:</span> We retain
            personal information only for as long as necessary to provide our services and comply with legal
            obligations. Specifically, financial transaction records may be retained for up to 7 years to comply
            with tax and accounting laws, even if you delete your account.
          </p>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            6. Children's Privacy &amp; Minors
          </h2>
          <p style={{ color: colors.textSecondary }}>
            <span className="font-semibold" style={{ color: colors.textPrimary }}>Traders:</span> The trading features
            of Pauv (buying/selling USDP and PVs) are strictly for users aged 18 and older. We do not knowingly
            collect personal information from children under 18 for the purpose of creating trading accounts.
          </p>
          <p className="font-semibold" style={{ color: colors.textPrimary }}>
            Minor Issuers (COPPA Notice):
          </p>
          <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
            <li>Pauv allows individuals under the age of 13 to be listed as &quot;Issuers&quot; only with verifiable parental consent.</li>
            <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Collection:</span> We collect the Minor’s name, image (headshot), and biographical details solely for the purpose of creating their public profile.</li>
            <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Consent:</span> We require the parent or legal guardian to sign a legal agreement (Letter of Intent and Custodial Agreement) and provide their own government ID to verify their authority before we collect or publish any data regarding the Minor.</li>
            <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Rights:</span> The parent/guardian has the right to review the Minor’s information, request its deletion, and revoke consent at any time by contacting support@pauv.com.</li>
            <li><span className="font-semibold" style={{ color: colors.textPrimary }}>No Tracking:</span> We do not use the Minor’s personal information for behavioral advertising or sell it to third parties.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            7. Changes to This Policy
          </h2>
          <p style={{ color: colors.textSecondary }}>
            We may update this Privacy Policy from time to time to reflect changes in our Phase 1
            operations or legal requirements. We will notify you of any significant changes by posting
            the new policy on this page and updating the &quot;Last Updated&quot; date at the top. Your continued
            use of the Platform after these changes constitutes acceptance of the revised policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            8. Contact Us
          </h2>
          <p style={{ color: colors.textSecondary }}>
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <div className="space-y-1" style={{ color: colors.textSecondary }}>
            <p>Pauv Inc.</p>
            <p>5206 Regency Cv</p>
            <p>Austin, TX 78724</p>
            <p>Email: support@pauv.com</p>
          </div>
        </section>
      </main>
    </div>
  );
}
