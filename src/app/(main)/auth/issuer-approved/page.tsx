"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { colors } from "@/lib/constants/colors";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";

/**
 * /auth/issuer-approved — Client-side page
 *
 * Handles the magic-link redirect after an issuer request is approved.
 * Supabase sends a magic link email; clicking it redirects here with
 * tokens in the URL hash fragment (#access_token=...&type=magiclink)
 * or a PKCE code (?code=...) in the query string.
 *
 * Flow:
 *  1. Parse hash tokens or PKCE code
 *  2. Establish session via setSession() or exchangeCodeForSession()
 *  3. Verify with getUser() (per project rules)
 *  4. Redirect to /account/issuer-dashboard
 */
export default function IssuerApprovedPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleMagicLinkRedirect = async () => {
      try {
        // ── Handle PKCE flow (?code= in query string) ──
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("[issuer-approved] Code exchange failed:", exchangeError.message);
            setError("Invalid or expired link. Please contact support.");
            return;
          }
        }

        // ── Handle implicit flow (#access_token= in hash) ──
        const hash = window.location.hash.substring(1);
        if (hash) {
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error("[issuer-approved] setSession failed:", sessionError.message);
              setError("Invalid or expired link. Please contact support.");
              return;
            }

            // Clean the hash from the URL so tokens aren't leaked in history
            window.history.replaceState(null, "", window.location.pathname);
          }
        }

        // Verify session using getUser() (per project rules — prevents stale tokens)
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("[issuer-approved] No session after redirect:", userError?.message);
          setError("Could not verify your session. Please try the link again or log in.");
          return;
        }

        // Success — redirect to Issuer Dashboard
        router.replace("/account/issuer-dashboard");
      } catch (err) {
        console.error("[issuer-approved] Unexpected error:", err);
        setError("Something went wrong. Please try the link again.");
      }
    };

    handleMagicLinkRedirect();
  }, [supabase, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: colors.backgroundDark }}
    >
      <div
        className="w-full max-w-md rounded-xl p-8 text-center"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        {error ? (
          <>
            <div className="text-4xl mb-4" role="img" aria-label="error">
              ⚠️
            </div>
            <p
              className="text-sm font-mono mb-4"
              style={{ color: colors.red }}
            >
              {error}
            </p>
            <a
              href="/login"
              className="text-sm font-mono underline transition-opacity hover:opacity-80"
              style={{ color: colors.gold }}
            >
              Go to Login
            </a>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner />
            <p
              className="text-sm font-mono"
              style={{ color: colors.textSecondary }}
            >
              Opening your Issuer Dashboard...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
