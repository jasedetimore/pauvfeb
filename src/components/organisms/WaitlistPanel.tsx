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
  const fontSize = absOffset === 0 ? "1.125rem" : absOffset === 1 ? "1rem" : "0.85rem";

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
          className="ml-1 font-mono text-xs font-bold tracking-widest px-2 py-0.5 rounded shrink-0"
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
  /** Show larger title + explanation (for standalone pages like assets/deposits) */
  expanded?: boolean;
  /** Override the position label (default: "Waitlist Position") */
  positionLabel?: string;
}

export const WaitlistPanel: React.FC<WaitlistPanelProps> = ({
  height = 400,
  expanded = false,
  positionLabel = "Waitlist Position",
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const { position, referralCode, neighbors: apiNeighbors, isLoading: waitlistLoading } = useWaitlist();

  const isLoading = authLoading || waitlistLoading;

  const [codeCopied, setCodeCopied] = useState(false);

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

  /* ── loading state ── */
  if (isLoading) {
    return (
      <div
        className="rounded-[10px] overflow-hidden relative"
        style={{ backgroundColor: colors.background, height }}
      >
        <div className="relative z-[2] flex flex-col items-center justify-between h-full py-6 px-4">
          {/* Top: position label + number */}
          <div className="flex flex-col items-center gap-2">
            <Skeleton width="140px" height="0.75rem" />
            <Skeleton width="90px" height={expanded ? "3rem" : "2.25rem"} />
          </div>

          {/* Middle: neighbor rows */}
          <div className="flex flex-col items-center gap-2 w-full max-w-md">
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

          {/* Bottom: share section */}
          <div className="flex flex-col items-center gap-3 w-full max-w-md">
            <Skeleton width="180px" height="0.85rem" />
            <Skeleton width="100%" height="44px" />
            <Skeleton width="260px" height="0.7rem" />
          </div>
        </div>
      </div>
    );
  }

  /* ── not logged in ── */
  if (!user) {
    return (
      <div
        className="rounded-[10px] overflow-hidden relative"
        style={{ backgroundColor: colors.background, height }}
      >
        <div
          className="relative z-[2] flex flex-col items-center justify-center gap-6 h-full px-4"
        >
          {/* Title */}
          <div className="flex flex-col items-center gap-2">
            <span
              className="font-mono text-xs tracking-[0.3em] uppercase"
              style={{ color: colors.gold }}
            >
              Early Access
            </span>
            <span
              className="font-mono text-2xl font-bold"
              style={{ color: colors.textPrimary }}
            >
              Join the Waitlist
            </span>
          </div>

          {/* Info */}
          <p
            className="font-mono text-base text-center max-w-sm leading-relaxed"
            style={{ color: colors.textSecondary }}
          >
            Create an account to reserve your spot.
            First 100 users trade on launch day — 100 more unlock every day after.
          </p>

          {/* CTA */}
          <a
            href="/register"
            className="px-8 py-3 rounded-md font-mono text-base font-semibold transition-all hover:brightness-110"
            style={{
              backgroundColor: colors.gold,
              color: colors.textDark,
            }}
          >
            Create Account
          </a>
        </div>
      </div>
    );
  }

  /* ── logged in — show waitlist position ── */
  const displayPos = position ?? 0;

  return (
    <div
      className="rounded-[10px] overflow-hidden relative select-none"
      style={{ backgroundColor: colors.background, height }}
    >
      {/* Radial glow behind the user's row */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(ellipse 60% 30% at 50% 42%, ${colors.gold}08 0%, transparent 100%)`,
        }}
      />

      <div className="relative z-[2] flex flex-col items-center justify-between h-full py-6 px-4">
        {/* ── Top label ── */}
        <div className="flex flex-col items-center gap-1">
          <span
            className={`font-mono tracking-[0.35em] uppercase ${expanded ? "text-sm" : "text-xs"}`}
            style={{ color: colors.textPrimary }}
          >
            {positionLabel}
          </span>
          <span
            className={`font-mono font-bold tabular-nums transition-all duration-150 ${expanded ? "text-5xl" : "text-4xl"}`}
            style={{
              color: colors.textPrimary,
              textShadow: `0 0 20px ${colors.gold}40`,
            }}
          >
            #{displayPos}
          </span>
        </div>

        {/* ── Scrolling names ── */}
        <div
          className="flex flex-col items-center w-full max-w-md rounded-lg py-1"
          style={{ border: `1px solid ${colors.boxOutline}` }}
        >
          {/* Top fade mask */}
          <div
            className="w-full h-4 pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, ${colors.background}, transparent)`,
            }}
          />

          {(() => {
            // Divider widths between rows (index = gap after row i).
            // Center gap is widest; outermost gaps are narrowest.
            const dividerWidths = ["30%", "62%", "62%", "30%"];
            // Find the index of the current user in the neighbors list
            const selfIdx = neighbors.findIndex((n) => n.isCurrentUser);
            return neighbors.map((n, i) => (
              <React.Fragment key={i}>
                <WaitlistRow
                  username={n.username}
                  position={n.position}
                  offset={i - (selfIdx >= 0 ? selfIdx : 2)}
                  isCurrentUser={!!n.isCurrentUser}
                />
                {i < neighbors.length - 1 && (
                  <div
                    className="pointer-events-none"
                    style={{
                      width: dividerWidths[i],
                      height: "1px",
                      backgroundColor: "#404040",
                      opacity: 0.45,
                      transition: "width 0.3s",
                    }}
                  />
                )}
              </React.Fragment>
            ));
          })()}

          {/* Bottom fade mask */}
          <div
            className="w-full h-4 pointer-events-none"
            style={{
              background: `linear-gradient(to top, ${colors.background}, transparent)`,
            }}
          />
        </div>

        {/* ── Referral section ── */}
        <div className="flex flex-col items-center gap-3 w-full max-w-md">
          <div className="flex flex-col items-center gap-1">
            <span
              className="font-mono text-sm font-medium"
              style={{ color: colors.textPrimary }}
            >
              Tell a friend about Pauv
            </span>
            <span
              className="font-mono text-xs"
              style={{ color: colors.textSecondary }}
            >
              Share the link below
            </span>
          </div>

          <button
            onClick={copyCode}
            className="group relative w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md font-mono text-base transition-all"
            style={{
              backgroundColor: `${colors.textPrimary}10`,
              border: `1px solid ${colors.textPrimary}30`,
              color: colors.textPrimary,
              cursor: "pointer",
            }}
          >
            {/* Code text */}
            <span className="tracking-wide font-semibold text-sm truncate">
              {codeCopied
                ? "Link copied!"
                : referralCode
                  ? `pauv.com/register?ref=${referralCode}`
                  : "pauv.com/register"}
            </span>

            {/* Copy icon */}
            {!codeCopied && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            )}
          </button>

          {/* Unlock info */}
          <p
            className="font-mono text-xs text-center leading-relaxed"
            style={{ color: colors.textSecondary }}
          >
            First 100 trade on launch day &bull; 100 more unlock daily
          </p>
        </div>
      </div>

      {/* ── CSS keyframes injected via style tag (only once) ── */}
      <style jsx global>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.25;
          }
          50% {
            transform: scale(1.04);
            opacity: 0.08;
          }
          100% {
            transform: scale(1);
            opacity: 0.25;
          }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
