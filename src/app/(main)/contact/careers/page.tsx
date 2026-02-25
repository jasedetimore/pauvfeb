"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { colors } from "@/lib/constants/colors";

export default function CareersPage() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.backgroundDark }}
    >
      <main className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        {/* Logo + Title block */}
        <div className="flex flex-col gap-6">
          <Link href="/">
            <Image
              src="/pauv_logo_gold.png"
              alt="Pauv"
              width={140}
              height={48}
              className="object-contain"
            />
          </Link>
          <h1
            className="text-4xl font-bold"
            style={{ color: colors.textPrimary }}
          >
            Careers
          </h1>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            The Ground Floor
          </p>
        </div>

        <div
          className="space-y-8"
          style={{ borderTop: `1px solid ${colors.border}`, paddingTop: "2rem" }}
        >
          {/* Honesty statement */}
          <section className="space-y-3">
            <p style={{ color: colors.textSecondary }}>
              Let&rsquo;s be Pauv-level honest: We can&rsquo;t pay you. At least, not in the
              &ldquo;U.S. Dollars that pay for rent and tacos&rdquo; kind of way. Currently,
              our entire staff is unpaid.
            </p>
          </section>

          {/* Why Join */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
              Why on earth would you join us?
            </h2>
            <p style={{ color: colors.textSecondary }}>
              Because we believe in the vision of a world where people can finally invest in
              each other&mdash;and we believe it enough to work for the glory and the equity
              while the &ldquo;No Budget&rdquo; launch is in motion. We are looking for
              believers, not clock-punchers.
            </p>
          </section>

          {/* Who We Need */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
              Who We Need
            </h2>
            <p style={{ color: colors.textSecondary }}>
              We are currently hunting for{" "}
              <span className="font-semibold" style={{ color: colors.textPrimary }}>
                Marketing Mavericks
              </span>{" "}
              and{" "}
              <span className="font-semibold" style={{ color: colors.textPrimary }}>
                Outreach Specialists
              </span>{" "}
              to help us build the buzz for our March launch. We need people who can turn a
              &ldquo;closed-loop&rdquo; system into the next cultural phenomenon.
            </p>
          </section>

          {/* The Offer */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
              The Offer
            </h2>
            <ul className="list-disc pl-6 space-y-3" style={{ color: colors.textSecondary }}>
              <li>
                <span className="font-semibold" style={{ color: colors.textPrimary }}>
                  Stock Options:
                </span>{" "}
                A piece of the pie before the pie is even out of the oven.
              </li>
              <li>
                <span className="font-semibold" style={{ color: colors.textPrimary }}>
                  A Future Paycheck:
                </span>{" "}
                Once we secure our seed round and clear our regulatory hurdles, we want the
                people who bled for the brand to be the first ones on the payroll.
              </li>
              <li>
                <span className="font-semibold" style={{ color: colors.textPrimary }}>
                  Total Autonomy:
                </span>{" "}
                You&rsquo;ll have more impact here than at a desk job you&rsquo;d want to
                quit anyway.
              </li>
            </ul>
          </section>

          {/* Contact */}
          <section
            className="space-y-3 pt-6"
            style={{ borderTop: `1px solid ${colors.border}` }}
          >
            <p style={{ color: colors.textSecondary }}>
              If you have the grit to build the future of speculative crowdfunding for zero
              initial dollars, reach out to our CEO directly:
            </p>
            <p className="font-semibold" style={{ color: colors.textPrimary }}>Contact</p>
            <a
              href="mailto:aiden.davenport@pauv.com"
              className="inline-block font-semibold hover:underline transition-colors"
              style={{ color: colors.gold }}
            >
              aiden.davenport@pauv.com
            </a>
          </section>

          {/* Back link */}
          <div className="pt-2">
            <Link
              href="/contact"
              className="text-sm hover:underline transition-colors"
              style={{ color: colors.textSecondary }}
            >
              ← Back to Contact
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
