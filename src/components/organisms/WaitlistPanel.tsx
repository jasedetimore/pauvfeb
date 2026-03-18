"use client";

import React, { useState, useCallback } from "react";
import { colors } from "@/lib/constants/colors";
import { useAuth } from "@/lib/hooks/useAuth";
import { useWaitlist } from "@/lib/hooks/useWaitlist";
import { Skeleton } from "@/components/atoms/Skeleton";

/* ─── sub-components ───────────────────────────────────────────── */

/** Animated scan-line overlay for the techy feel */
const ScanLines: React.FC = () => (
  <div
    className="pointer-events-none absolute inset-0 z-[1]"
    style={{
      background:
        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
    }}
  />
);

/** Subtle animated pulse ring behind the user row */
const PulseRing: React.FC = () => (
  <span
    className="absolute inset-0 rounded-md animate-pulse-ring pointer-events-none"
    style={{
      border: `1px solid ${colors.gold}`,
      opacity: 0.2,
    }}
  />
);

/* ─── types ────────────────────────────────────────────────────── */

interface WaitlistRowProps {
  username: string;
  position: number;
  /** -2, -1, 0, 1, 2 where 0 = current user */
  offset: number;
  isCurrentUser: boolean;
}

const WaitlistRow: React.FC<WaitlistRowProps> = ({
  username,
  position,
  offset,
  isCurrentUser,
}) => {
  const absOffset = Math.abs(offset);

  // Scale + opacity mapped by distance from center
  const scale = absOffset === 0 ? 1 : absOffset === 1 ? 0.88 : 0.74;
  const opacity = absOffset === 0 ? 1 : absOffset === 1 ? 0.5 : 0.25;
  const fontSize = absOffset === 0 ? "1.2rem" : absOffset === 1 ? "1.05rem" : "0.9rem";

  return (
    <div
      className="relative flex items-center justify-center gap-4 px-4 py-1.5 transition-all duration-500"
      style={{
        opacity,
        transform: `scale(${scale})`,
        filter: absOffset >= 2 ? "blur(0.5px)" : "none",
      }}
    >
      {isCurrentUser && <PulseRing />}

      {/* Position # */}
      <span
        className="font-mono tabular-nums w-12 text-right shrink-0"
        style={{
          fontSize,
          color: isCurrentUser ? colors.gold : colors.textSecondary,
        }}
      >
        #{position}
      </span>

      {/* Username */}
      <span
        className="font-mono truncate max-w-[220px]"
        style={{
          fontSize,
          color: isCurrentUser ? colors.gold : colors.textPrimary,
          fontWeight: isCurrentUser ? 700 : 400,
          textShadow: isCurrentUser
            ? `0 0 12px ${colors.gold}80`
            : "none",
        }}
      >
        @{username}
      </span>

      {/* "YOU" badge */}
      {isCurrentUser && (
        <span
          className="ml-1 font-mono text-sm font-bold tracking-widest px-2 py-0.5 rounded shrink-0"
          style={{
            backgroundColor: `${colors.gold}22`,
            color: colors.gold,
            border: `1px solid ${colors.gold}44`,
          }}
        >
          YOU
        </span>
      )}
    </div>
  );
};

/* ─── main component ───────────────────────────────────────────── */

export interface WaitlistPanelProps {
  /** Chart area height – the panel fills this same space */
  height?: number;
  /** When true, panel height is content-driven instead of fixed */
  fitContent?: boolean;
  /** Show larger title + explanation (for standalone pages like assets/deposits) */
  expanded?: boolean;
  /** Override the position label (default: "Waitlist Position") */
  positionLabel?: string;
  /** When true, hides the intro description paragraph (use when the page already provides that context) */
  hideIntro?: boolean;
}

export const WaitlistPanel: React.FC<WaitlistPanelProps> = ({
  height = 400,
  fitContent = false,
  expanded = false,
  positionLabel = "Waitlist Position",
  hideIntro = false,
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const { position, referralCode, neighbors: apiNeighbors, isLoading: waitlistLoading } = useWaitlist();

  const isLoading = authLoading || waitlistLoading;

  const [codeCopied, setCodeCopied] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailWaitlistData, setEmailWaitlistData] = useState<{
    referralCode: string;
    position?: number;
    isExisting?: boolean;
  } | null>(null);
  const [submitError, setSubmitError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes("@")) {
      setSubmitError("Please enter a valid email");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    // Grab possible referral code from URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");

    try {
      const res = await fetch("/api/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, referredBy: ref }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to join waitlist");
      }

      setEmailWaitlistData({
        referralCode: data.data.referralCode,
        position: data.data.position,
        isExisting: data.data.isExisting,
      });
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyEmailCode = useCallback(() => {
    if (!emailWaitlistData?.referralCode) return;
    const link = `https://pauv.com/register?ref=${emailWaitlistData.referralCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }, [emailWaitlistData]);

  // Map API neighbors to the shape the UI expects
  const neighbors = apiNeighbors.map((n) => ({
    username: n.username,
    position: n.position,
    isCurrentUser: n.isCurrentUser,
  }));

  const referralLink = user && referralCode
    ? `https://pauv.com/register?ref=${referralCode}`
    : user
      ? `https://pauv.com/register`
      : "";

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }, [referralLink]);

  const panelStyle = fitContent
    ? { backgroundColor: colors.background }
    : { backgroundColor: colors.background, height };

  /* ── loading state ── */
  if (isLoading) {
    return (
      <div
        className="rounded-[10px] overflow-hidden relative"
        style={panelStyle}
      >
        <div className="relative z-[2] flex flex-col items-center pt-2 pb-6 px-4">
          {/* Top: intro text (only when not hidden) + position */}
          <div className="flex flex-col items-center gap-2 mb-4 text-center max-w-md">
            {!hideIntro && <Skeleton width="320px" height="0.85rem" />}
            <Skeleton width="220px" height={expanded ? "2rem" : "1.5rem"} />
          </div>

          {/* Middle: neighbor rows */}
          <div className="flex flex-col items-center gap-2 w-full max-w-md rounded-lg py-3 mb-5">
            {[0.74, 0.88, 1, 0.88, 0.74].map((scale, i) => (
              <div
                key={i}
                className="flex items-center justify-center gap-4 px-4 py-1.5"
                style={{
                  opacity: i === 2 ? 1 : i === 1 || i === 3 ? 0.5 : 0.25,
                  transform: `scale(${scale})`,
                }}
              >
                <Skeleton width="48px" height="1rem" />
                <Skeleton width="120px" height="1rem" />
                {i === 2 && <Skeleton width="40px" height="1rem" />}
              </div>
            ))}
          </div>

          {/* Bottom: referral section */}
          <div className="flex flex-col items-center gap-2 w-full max-w-md">
            <Skeleton width="220px" height="0.95rem" />
            <Skeleton width="240px" height="0.8rem" />
            <Skeleton width="100%" height="44px" />
          </div>
        </div>
      </div>
    );
  }

  /* ── not logged in — Email Input Flow ── */
  if (!user) {
    if (emailWaitlistData) {
      // SUCCESS STATE (Email Submitted)
      return (
        <div
          className="rounded-[10px] overflow-hidden relative"
          style={panelStyle}
        >
          {/* Subtle glow */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              background: `radial-gradient(ellipse 60% 30% at 50% 42%, ${colors.gold}08 0%, transparent 100%)`,
            }}
          />
          <div className="relative z-[2] flex flex-col items-center justify-center gap-5 h-full px-4 text-center">

            <div className="flex flex-col items-center gap-4 mb-6 mt-2 text-center w-full max-w-[420px]">
              <span className="font-mono text-xl sm:text-2xl font-bold tracking-wide" style={{ color: colors.textPrimary }}>
                Your position in line:
              </span>
              <span className="font-mono text-5xl sm:text-5xl font-bold tracking-tight" style={{ color: colors.gold }}>
                {emailWaitlistData.position ? `#${emailWaitlistData.position.toLocaleString()}` : "Waitlisted"}
              </span>
            </div>

            <div className="flex flex-col items-center gap-6 mb-8 w-full max-w-[420px]">
              <p className="font-mono text-base sm:text-lg text-center leading-relaxed" style={{ color: colors.textPrimary }}>
                Why a line? We&apos;re launching in waves to ensure stability at scale.
              </p>

              <p className="font-mono text-xl sm:text-2xl text-center leading-snug" style={{ color: colors.textPrimary }}>
                Complete your account to move up your spots
              </p>
            </div>

            <a
              href={`/register?email=${encodeURIComponent(emailInput)}`}
              className="flex items-center justify-center w-full max-w-[420px] px-8 py-3 rounded-md font-mono text-base font-semibold transition-all hover:brightness-110"
              style={{
                backgroundColor: colors.gold,
                color: colors.textDark,
              }}
            >
              Complete Account Setup
            </a>
          </div>
        </div>
      );
    }

    // INPUT STATE (Not Submitted Yet)
    return (
      <div
        className="rounded-[10px] overflow-hidden relative"
        style={panelStyle}
      >
        <div
          className="relative z-[2] flex flex-col items-center justify-center gap-6 h-full px-4"
        >
          {/* Title & Info Grouping */}
          <div className="flex flex-col items-center gap-4 text-center w-full">
            {/* Title */}
            <div className="flex flex-col items-center gap-1">
              <h2
                className="font-mono text-xl sm:text-2xl font-bold"
                style={{ color: colors.gold }}
              >
                Early Access
              </h2>
              <h1
                className="font-mono text-4xl sm:text-4xl font-bold tracking-tight"
                style={{ color: colors.textPrimary }}
              >
                Join the waitlist
              </h1>
            </div>

            {/* Info */}
            <p
              className="font-mono text-base sm:text-lg text-center max-w-[420px] leading-relaxed"
              style={{ color: colors.textPrimary }}
            >
              Enter your email to reserve your spot. First wave of users trade on launch day — more will unlock every day after.
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="w-full max-w-[420px] flex flex-col gap-3">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 rounded-md font-mono text-sm outline-none transition-all"
              style={{
                backgroundColor: colors.boxLight,
                color: colors.textPrimary,
                border: `1px solid ${colors.boxOutline}`,
              }}
              required
            />
            {submitError && (
              <span className="font-mono text-xs text-red-400 text-center">
                {submitError}
              </span>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-8 py-3 rounded-md font-mono text-base font-semibold transition-all hover:brightness-110 disabled:opacity-50"
              style={{
                backgroundColor: colors.gold,
                color: colors.textDark,
              }}
            >
              {isSubmitting ? "Submitting..." : "Join Waitlist"}
            </button>
          </form>

        </div>
      </div>
    );
  }

  /* ── logged in — show waitlist position ── */
  const displayPos = position ?? 0;

  return (
    <div
      className="rounded-[10px] overflow-hidden relative select-none"
      style={panelStyle}
    >
      {/* Radial glow behind the user's row */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(ellipse 60% 30% at 50% 42%, ${colors.gold}08 0%, transparent 100%)`,
        }}
      />

      <div className="relative z-[2] flex flex-col items-center justify-center gap-5 h-full px-4 text-center">
        {/* ── Top message ── */}
        <div className="flex flex-col items-center gap-4 mb-6 mt-2 text-center w-full max-w-[420px]">
          {!hideIntro && (
            <span
              className="font-mono text-xl sm:text-2xl font-bold tracking-wide"
              style={{ color: colors.textPrimary }}
            >
              Your position in line:
            </span>
          )}
          <span
            className="font-mono text-5xl sm:text-6xl font-bold tracking-tight"
            style={{ color: colors.gold }}
          >
            {displayPos > 0 ? `#${displayPos.toLocaleString()}` : "Waitlisted"}
          </span>
        </div>

        {!hideIntro && (
          <div className="flex flex-col items-center gap-6 mb-8 w-full max-w-[420px]">
            <p
              className="font-mono text-base sm:text-lg text-center leading-relaxed"
              style={{ color: colors.textPrimary }}
            >
              Why a line? We're launching in waves to ensure stability at scale.
            </p>
          </div>
        )}

        {/* ── Referral Block (Simplified) ── */}
        <div className="flex flex-col items-center gap-2 mt-4 w-full max-w-[420px]">
          <span
            className="font-mono text-base font-medium"
            style={{ color: colors.textPrimary }}
          >
            Want to move forward in line?
          </span>
          <span
            className="font-mono text-sm mb-2"
            style={{ color: colors.textSecondary }}
          >
            Refer a friend to move up in line:
          </span>
          <button
            onClick={copyCode}
            className="group relative w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md font-mono text-sm transition-all"
            style={{
              backgroundColor: `${colors.textPrimary}08`,
              border: `1px solid ${colors.textPrimary}25`,
              color: colors.textPrimary,
              cursor: "pointer",
            }}
          >
            <span
              className="truncate text-center"
              style={{ color: codeCopied ? colors.green : colors.textPrimary }}
            >
              {codeCopied ? "Copied!" : referralLink}
            </span>
            {!codeCopied ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 shrink-0 opacity-50 group-hover:opacity-100"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke={colors.green}
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

