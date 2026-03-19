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
            Last Updated: March 18, 2026
          </p>

          <div className="space-y-4" style={{ color: colors.textPrimary }}>
            <p className="font-semibold">
              IMPORTANT NOTICE: PLEASE READ CAREFULLY.
            </p>
            <p className="font-semibold">
              THESE TERMS CONTAIN A BINDING ARBITRATION PROVISION AND CLASS ACTION WAIVER.
            </p>
            <p className="font-semibold">
              CLOSED-LOOP PLATFORM DISCLOSURE: PAUV OPERATES A CLOSED-LOOP SYSTEM. OUR INTERNAL LEDGER CREDIT,
              "USDP", CANNOT BE TRANSFERRED TO OTHER USERS, CANNOT BE SENT TO EXTERNAL CRYPTO WALLETS, AND
              CANNOT BE USED OUTSIDE THE PLATFORM. USDP MAY ONLY BE USED WITHIN THE PAUV PLATFORM TO ACQUIRE
              DIGITAL COLLECTIBLES ("PVs") OR BE REDEEMED BY PAUV FOR FIAT WITHDRAWAL BACK TO YOUR LINKED
              BANK ACCOUNT.
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
              <span className="font-semibold" style={{ color: colors.textPrimary }}>General Users:</span>{" "}
              To create an account to open positions, back public figures, or hold USDP and PVs, you must be
              at least 18 years old and a resident of a jurisdiction where the use of our services is permitted.
            </p>
            <p style={{ color: colors.textSecondary }}>
              <span className="font-semibold" style={{ color: colors.textPrimary }}>Talent:</span>{" "}
              An individual under the age of 18 ("Minor") may be listed as Talent on the Platform only if
              a parent or legal guardian ("Guardian") creates and manages the account on their behalf. The
              Guardian accepts full legal responsibility for the Minor's participation and agrees to these Terms.
            </p>
            <p style={{ color: colors.textSecondary }}>
              <span className="font-semibold" style={{ color: colors.textPrimary }}>Representation:</span>{" "}
              By using the Platform, you represent and warrant that you meet these age requirements. Access
              is currently restricted to residents of the United States.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>3. The Pauv Platform &amp; Services</h2>
            <p style={{ color: colors.textSecondary }}>
              Pauv is a digital marketplace, functioning as the world's first market for human potential. We
              allow fans to open a position on the public perception of individuals by acquiring speculative
              digital collectibles known as "Personal Value" units (PVs).
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Nature of the Platform:</span> Pauv is a closed-loop entertainment and collectible platform. It is not a stock market, a securities exchange, or a bank.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Nature of PVs:</span> PVs are digital collectibles tracked on a private hybrid ledger. PVs represent market sentiment and public perception; they are not equity, do not confer ownership in a person, and grant no rights to future income, voting rights, or legal contracts associated with any Talent.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Supply:</span> You acknowledge that Pauv does not guarantee a fixed or capped supply of PVs. New PVs are dynamically issued or removed as users trade them along our automated continuous pricing curve.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>4. USDP Credits &amp; Closed-Loop System</h2>
            <p style={{ color: colors.textSecondary }}>
              To back a Talent and acquire PVs, users must first fund their account with USDP, our internal
              platform credit.
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Definition:</span> USDP is a closed-loop, dollar-denominated ledger unit used solely to facilitate transactions within the Pauv Platform. 1 USDP is always equivalent to 1 USD within the Platform.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>No Outside Value:</span> USDP has no value outside of the Platform. It is not a cryptocurrency, not a stablecoin, and not legal tender.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Redemptions &amp; Withdrawals:</span> You may redeem your USDP balance for its underlying fiat value at any time. Upon a withdrawal request, Pauv will remit the equivalent U.S. dollars back to your linked bank account, subject to standard ledger reconciliation and anti-money laundering (AML) verification windows.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>No Peer-to-Peer Transfers:</span> You may not sell, gift, transfer, or trade USDP or PVs directly to other users.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>5. Account Registration &amp; Security</h2>
            <p style={{ color: colors.textSecondary }}>
              You must provide accurate, current, and complete information during the registration process.
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Security:</span> You are responsible for maintaining the confidentiality of your login credentials. You accept responsibility for all activities that occur under your account.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Verification (KYC/CIP):</span> As a registered Money Services Business (MSB), Pauv maintains strict Customer Identification Programs (CIP). We reserve the right to require identity verification at any time. Failure to provide requested information will result in account suspension and blocked withdrawals.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>6. Trading PVs (Algorithmic Pricing)</h2>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Platform as Counterparty:</span> All trades are executed directly against the Platform's automated smart curve. There is no user-to-user order matching and no bid/ask spreads.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Continuous Linear Growth Model:</span> You acknowledge that PV prices are determined deterministically by a mathematical formula based on circulating supply.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>The Pricing Algorithm:</span> The starting price for every Talent's PV is strictly set at $0.01. For every individual PV unit purchased by a user, the price of the next available unit increases by exactly $0.000001. Conversely, each time a PV unit is traded back to the platform, the price of the asset decreases by exactly $0.000001.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Pricing Volatility:</span> Because price is mathematically tied to the number of units held by the public, the price can be highly volatile. If market sentiment shifts and many users trade away their positions at once, the value of your PVs will mathematically decrease.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Transaction Fees:</span> A transaction fee of 0.25% is deducted from every buy or sell order to support the Talent and the Platform.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>7. Talent Terms (For Public Figures &amp; Creators)</h2>
            <p style={{ color: colors.textSecondary }}>
              If you list yourself (or your Minor ward) as "Talent" on Pauv:
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Grant of Rights:</span> You grant Pauv Inc. a non-exclusive, worldwide, royalty-free license to use the name, image, likeness, and username provided for the purpose of identifying the PVs and marketing the Platform.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Compensation &amp; Royalty Payments:</span> As consideration for listing your profile, Talent receives continuous royalty payments in USD fiat. These royalty payments consist of (i) 0.25% of all buy and sell transactions of their PV, and (ii) 1% of their annual PV market capitalization. These royalties are paid out monthly directly to the Talent's linked bank account. Talent does not receive PV units as payment. While Talents may choose to purchase their own PV on the open market using their own funds, platform distributions are strictly paid in cash.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>No Fiduciary Duty:</span> Listing on Pauv does not create a fiduciary relationship, common enterprise, or business partnership between the Talent and PV holders. The Talent does not owe PV holders any financial returns, managerial efforts, performance obligations, or special treatment.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Minors &amp; Guardians:</span> If the Talent is a Minor, the Guardian acknowledges they have the legal authority to sign on the Minor's behalf. The Guardian agrees that all USD royalty payments generated by the Minor's profile are held for the benefit of the Minor.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>8. Prohibited Conduct</h2>
            <p style={{ color: colors.textSecondary }}>
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li>Use the Platform for money laundering, terrorist financing, or other illicit financial activities.</li>
              <li>Use bots, spiders, or automated scripts to interact with the Platform.</li>
              <li>Engage in market manipulation, wash trading, or coordinated schemes to artificially inflate PV sentiment and prices.</li>
              <li>Attempt to sell USDP or PVs outside of the closed-loop Platform (e.g., attempting to sell your account credentials on third-party sites).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>9. Risk Disclosure &amp; Disclaimers</h2>
            <p className="font-semibold" style={{ color: colors.textPrimary }}>
              YOU ACKNOWLEDGE THAT TRADING PVS INVOLVES SIGNIFICANT RISK.
            </p>
            <ul className="list-disc pl-6 space-y-2" style={{ color: colors.textSecondary }}>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Not an Investment:</span> PVs are speculative digital collectibles designed to track market sentiment and for entertainment purposes. They are not securities, not shares, and not a source of passive income or guaranteed yield. Pauv does not provide financial, investment, or tax advice.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Loss of Value:</span> The value of a PV can drop significantly based on public perception and mathematical supply. You should never back a profile with funds you cannot afford to lose.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>Regulatory Risk:</span> Legislative and regulatory changes at the state or federal level may adversely affect the use, transfer, and value of USDP and PVs.</li>
              <li><span className="font-semibold" style={{ color: colors.textPrimary }}>&quot;As Is&quot; Service:</span> The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>10. Limitation of Liability</h2>
            <p style={{ color: colors.textSecondary }}>
              To the maximum extent permitted by law, Pauv Inc. and its affiliates shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, or any loss of profits or
              revenues. In no event shall Pauv's aggregate liability exceed the amount you deposited to Pauv in the
              twelve (12) months preceding the claim.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>11. Termination</h2>
            <p style={{ color: colors.textSecondary }}>
              Pauv reserves the right to suspend or terminate your account at our sole discretion, without
              notice, for conduct that we believe violates these Terms, violates our AML policies, or is
              harmful to other users, us, or third parties.
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
