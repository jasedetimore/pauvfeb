"use client";

import React from "react";
import { AuthHeader } from "@/components/molecules/AuthHeader";
import { WaitlistPanel } from "@/components/organisms/WaitlistPanel";
import { colors } from "@/lib/constants/colors";
import { useAuth } from "@/lib/hooks/useAuth";
import { useWaitlist } from "@/lib/hooks/useWaitlist";
import { Skeleton } from "@/components/atoms/Skeleton";

export default function WaitlistPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { position, referralCount, isLoading: waitlistLoading } = useWaitlist();

  const isLoading = authLoading || waitlistLoading;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <AuthHeader
        navigationLinks={[
          { href: "/", label: "Issuers" },
          { href: "/list-yourself", label: "List Yourself" },
          { href: "/about", label: "About" },
        ]}
      />

      {/* Main content */}
      <main className="pt-10 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Page heading */}
          <div className="text-center mb-6">
            <h1
              className="font-mono text-3xl sm:text-4xl font-bold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Waitlist
            </h1>
            <p
              className="font-mono text-sm sm:text-base leading-relaxed"
              style={{ color: colors.textSecondary }}
            >
              We&apos;re releasing access in waves so we can test at scale.
              The first 500 users begin trading on launch day, then we&apos;ll
              unlock more each day after. Refer a friend to increase your
              position by 50.
            </p>
          </div>

          {/* Waitlist panel — large */}
          <div className="mb-10">
            <WaitlistPanel height={480} expanded positionLabel="Your Position" />
          </div>

          {/* Referrals section */}
          <div
            className="rounded-[10px] p-6"
            style={{
              backgroundColor: colors.box,
              border: `1px solid ${colors.boxOutline}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="font-mono text-lg font-semibold"
                style={{ color: colors.textPrimary }}
              >
                Your Referrals
              </h2>
              {isLoading ? (
                <Skeleton width="40px" height="1.25rem" />
              ) : (
                <span
                  className="font-mono text-sm px-2.5 py-0.5 rounded"
                  style={{
                    backgroundColor: colors.boxLight,
                    color: colors.textSecondary,
                  }}
                >
                  {user && position ? String(referralCount) : "—"}
                </span>
              )}
            </div>

            <p
              className="font-mono text-sm mb-6 leading-relaxed"
              style={{ color: colors.textSecondary }}
            >
              When you refer a friend who signs up, you move up 50 spots on the
              waitlist. Share your link from the panel above to get started.
            </p>

            {/* Referral count display */}
            {user && position && referralCount > 0 ? (
              <div
                className="rounded-lg py-6 flex flex-col items-center gap-2"
                style={{ backgroundColor: colors.boxLight }}
              >
                <span
                  className="font-mono text-3xl font-bold"
                  style={{ color: colors.gold }}
                >
                  {referralCount}
                </span>
                <span
                  className="font-mono text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  {referralCount === 1 ? "friend referred" : "friends referred"}
                </span>
                <span
                  className="font-mono text-xs mt-1"
                  style={{ color: colors.textMuted }}
                >
                  You&apos;ve moved up {referralCount * 50} spots!
                </span>
              </div>
            ) : (
            /* Empty state */
            <div
              className="rounded-lg py-10 flex flex-col items-center gap-3"
              style={{ backgroundColor: colors.boxLight }}
            >
              <svg
                className="w-10 h-10 opacity-30"
                fill="none"
                stroke={colors.textSecondary}
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
              <span
                className="font-mono text-sm"
                style={{ color: colors.textSecondary }}
              >
                No referrals yet
              </span>
            </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
