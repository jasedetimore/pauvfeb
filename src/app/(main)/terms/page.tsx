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
            Last Updated: February 18, 2026
          </p>

          <div className="space-y-4" style={{ color: colors.textPrimary }}>
            <p className="font-semibold">
              IMPORTANT NOTICE: PLEASE READ CAREFULLY.
            </p>
            <p className="font-semibold">
              THESE TERMS CONTAIN A BINDING ARBITRATION PROVISION AND CLASS ACTION WAIVER.
            </p>
            <p className="font-semibold">
              PHASE 1 BETA DISCLOSURE: PAUV IS CURRENTLY IN A "PHASE 1" LAUNCH STATE. DURING THIS PHASE,
              ALL PURCHASES OF "USDP" CREDITS ARE FINAL. USDP CANNOT BE REDEEMED FOR CASH, CANNOT BE
              WITHDRAWN TO A BANK ACCOUNT, AND CANNOT BE TRANSFERRED TO OTHER USERS. USDP MAY ONLY BE
              USED WITHIN THE PAUV PLATFORM TO ACQUIRE DIGITAL COLLECTIBLES.
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
              To create an account to buy, sell, or hold USDP and PVs, you must be at least 18 years old and
              a resident of a jurisdiction where the use of our services is permitted.
            </p>
            <p style={{ color: colors.textSecondary }}>
              <span className="font-semibold" style={{ color: colors.textPrimary }}>Issuers:</span>{" "}
              An individual under the age of 18 ("Minor") may be listed as an Issuer on the Platform only if
              a parent or legal guardian ("Guardian") creates and manages the account on their behalf. The
              Guardian accepts full legal responsibility for the Minor’s participation and agrees to these Terms.
            </p>
            <p style={{ color: colors.textSecondary }}>
              <span className="font-semibold" style={{ color: colors.textPrimary }}>Representation:</span>{" "}
              By using the Platform, you represent and warrant that you meet these age requirements. Access
              is currently restricted to residents of the United States.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>3. The Pauv Platform &amp; Services (Phase 1)</h2>
            <p style={{ color: colors.textSecondary }}>
              Pauv is a digital marketplace that allows users to acquire speculative digital collectibles known
              as "Personal Value" units (PVs).
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Nature of the Platform:</span> Pauv is a closed-loop entertainment and collectible platform. It is not a stock exchange, a securities exchange, or a bank.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Nature of PVs:</span> PVs are digital collectibles tracked on a private ledger. PVs represent sentiment and popularity; they do not represent equity, ownership in a person, rights to future income, voting rights, or a debt owed by any Issuer.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Supply:</span> You acknowledge that Pauv does not guarantee a fixed or capped supply of PVs. New PVs are minted and issued dynamically as users purchase them.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>4. USDP Credits &amp; Closed-Loop System</h2>
            <p style={{ color: colors.textSecondary }}>
              To acquire PVs, users must first obtain USDP, our internal platform credit.
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Definition:</span> USDP is a limited-license virtual credit used solely to facilitate transactions within the Pauv Platform.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>No Cash Value:</span> USDP has no value outside of the Platform. It is not a cryptocurrency, not a stablecoin, and not legal tender.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>No Withdrawals (Phase 1):</span> You acknowledge and agree that during Phase 1, USDP is non-redeemable. You cannot withdraw USDP to a bank account, credit card, or crypto wallet. Once you purchase USDP, you may only use it to acquire PVs on the Platform.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>No Transfers:</span> You may not sell, gift, transfer, or trade USDP or PVs to other users directly (Peer-to-Peer transfers are disabled).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>5. Account Registration &amp; Security</h2>
            <p style={{ color: colors.textSecondary }}>
              You must provide accurate, current, and complete information during the registration process.
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Security:</span> You are responsible for maintaining the confidentiality of your login credentials. You accept responsibility for all activities that occur under your account.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Verification:</span> Pauv reserves the right to require identity verification (KYC) at any time. Failure to provide requested information may result in account suspension.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>6. Trading PVs (Algorithmic Pricing)</h2>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Platform as Counterparty:</span> In Phase 1, all trades are executed directly against the Platform. You are buying from and selling to Pauv Inc., not directly to other users.</li>
              <li>
                <span className="font-semibold" style={{ color: colors.textPrimary }}>Linear Pricing Model:</span> You acknowledge that PV prices are determined by a linear algorithmic pricing model (a "bonding curve"), not by a traditional order book or bid/ask spread.
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Price Increases:</span> As more PVs are purchased, the price per PV increases mathematically.</li>
                  <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Price Decreases:</span> As PVs are sold back to the Platform, the price per PV decreases mathematically.</li>
                </ul>
              </li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Pricing Volatility:</span> Because price is mathematically tied to the number of units sold, the price can be extremely volatile. If many users sell at once, the value of your PVs could drop significantly.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Transaction Fees:</span> A transaction fee (disclosed at the time of trade) may be deducted from every buy or sell order.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>7. Issuer Terms (For Celebrities/Creators)</h2>
            <p style={{ color: colors.textSecondary }}>
              If you list yourself (or your Minor ward) as an "Issuer" on Pauv:
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Grant of Rights:</span> You grant Pauv Inc. a non-exclusive, worldwide, royalty-free license to use the name, image, likeness, and username provided for the purpose of identifying the PVs and marketing the Platform.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Minors &amp; Guardians:</span> If the Issuer is a Minor, the Guardian acknowledges they have the legal authority to sign on the Minor’s behalf. The Guardian agrees that all financial benefits (if any) generated by the Minor&apos;s profile are held for the benefit of the Minor. Control of the account must be transferred to the Minor upon reaching the age of majority (18), subject to identity verification.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>No Fiduciary Duty:</span> Listing on Pauv does not create a fiduciary relationship between the Issuer and PV holders. The Issuer does not owe PV holders any financial returns, performance obligations, or special treatment.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Compensation:</span> Issuers may receive internal credits (PVs) based on trading volume or market cap. These credits are subject to the Phase 1 restriction: they cannot currently be withdrawn for fiat currency.</li>
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
              <li>Attempt to sell USDP or PVs outside of the Platform (e.g., selling your account on eBay).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>9. Risk Disclosure &amp; Disclaimers</h2>
            <p className="font-semibold" style={{ color: colors.textPrimary }}>
              YOU ACKNOWLEDGE THAT TRADING PVS INVOLVES SIGNIFICANT RISK.
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Not an Investment:</span> PVs should be treated as collectibles for entertainment purposes. Pauv does not provide financial, investment, or tax advice.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Loss of Value:</span> The value of a PV can drop to zero. You should not spend money on USDP that you cannot afford to lose.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Regulatory Risk:</span> Legislative and regulatory changes or actions at the state, federal, or international level may adversely affect the use, transfer, exchange, and value of USDP and PVs.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>&quot;As Is&quot; Service:</span> The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>10. Limitation of Liability</h2>
            <p style={{ color: colors.textSecondary }}>
              To the maximum extent permitted by law, Pauv Inc. and its affiliates shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, or any loss of profits or
              revenues. In no event shall Pauv’s aggregate liability exceed the amount you paid to Pauv in the
              twelve (12) months preceding the claim.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>11. Termination</h2>
            <p style={{ color: colors.textSecondary }}>
              Pauv reserves the right to suspend or terminate your account at our sole discretion, without
              notice, for conduct that we believe violates these Terms or is harmful to other users, us, or
              third parties, or for any other reason.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>12. Governing Law</h2>
            <p style={{ color: colors.textSecondary }}>
              These Terms shall be governed by and construed in accordance with the laws of the State of Texas,
              without regard to its conflict of law principles.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>13. Dispute Resolution (Arbitration)</h2>
            <p style={{ color: colors.textSecondary }}>
              Any dispute arising from or relating to these Terms or your use of the Platform shall be resolved
              by binding arbitration in Austin, Texas. You waive your right to participate in a class action
              lawsuit or class-wide arbitration.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
