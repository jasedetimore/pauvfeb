"use client";

/**
 * AnimatedBackground — Ambient Gold Aura
 *
 * Renders 3 large radial-gradient orbs that drift slowly across the viewport.
 * Uses only CSS transforms for animation so the work stays on the GPU
 * compositor thread with zero layout recalculations.
 *
 * Keyframes are defined in globals.css (not inline <style>) for reliable
 * rendering in Next.js App Router.
 *
 * Performance: radial-gradient is rasterized once per orb; no per-frame blur.
 * Accessibility: all motion pauses when prefers-reduced-motion is enabled.
 */

const GOLD = "229, 198, 141"; // colors.gold (#E5C68D) as RGB channels
const WARM = "180, 140, 80";  // darker warm accent for variety

export function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Orb 1 — top-left, large warm gold */}
      <div
        className="aura-orb"
        style={{
          position: "absolute",
          borderRadius: "50%",
          willChange: "transform",
          width: 1200,
          height: 1200,
          top: "-20%",
          left: "-15%",
          background: `radial-gradient(circle, rgba(${GOLD}, 0.12) 0%, rgba(${GOLD}, 0.04) 40%, transparent 70%)`,
          animation: "aura-drift-1 12s ease-in-out infinite",
        }}
      />

      {/* Orb 2 — right side, mid-tone */}
      <div
        className="aura-orb"
        style={{
          position: "absolute",
          borderRadius: "50%",
          willChange: "transform",
          width: 1000,
          height: 1000,
          top: "25%",
          right: "-20%",
          background: `radial-gradient(circle, rgba(${WARM}, 0.10) 0%, rgba(${WARM}, 0.03) 40%, transparent 70%)`,
          animation: "aura-drift-2 15s ease-in-out infinite",
        }}
      />

      {/* Orb 3 — bottom-center, subtle */}
      <div
        className="aura-orb"
        style={{
          position: "absolute",
          borderRadius: "50%",
          willChange: "transform",
          width: 1100,
          height: 1100,
          bottom: "-25%",
          left: "15%",
          background: `radial-gradient(circle, rgba(${GOLD}, 0.09) 0%, rgba(${GOLD}, 0.03) 40%, transparent 70%)`,
          animation: "aura-drift-3 18s ease-in-out infinite",
        }}
      />
    </div>
  );
}
