"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { colors } from "@/lib/constants/colors";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";

/**
 * /auth/confirm-invite — Client-side page
 *
 * Handles the Supabase invite redirect.
 * Supabase uses the implicit flow for invitations, returning tokens
 * in the URL hash fragment (#access_token=...&type=invite).
 * Hash fragments are only accessible client-side, so this MUST be
 * a client page (not a Route Handler).
 *
 * Also handles the PKCE flow (?code=...) as a fallback in case
 * the Supabase project is configured to use PKCE.
 *
 * Flow:
 *  1. The @supabase/ssr browser client auto-detects hash tokens
 *  2. We verify the session with getUser()
 *  3. Redirect to /set-password
 */
export default function ConfirmInvitePage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleInviteRedirect = async () => {
      try {
        // ── Handle PKCE flow (?code= in query string) ──
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("[confirm-invite] Code exchange failed:", exchangeError.message);
            setError("Invalid or expired invite link. Please request a new one.");
            return;
          }
        }

        // ── Handle implicit flow (#access_token= in hash) ──
        // Supabase invite redirects include tokens in the URL hash fragment.
        // The browser-side client can't always auto-detect these reliably,
        // so we parse them explicitly and call setSession().
        const hash = window.location.hash.substring(1); // strip leading #
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
              console.error("[confirm-invite] setSession failed:", sessionError.message);
              setError("Invalid or expired invite link. Please request a new one.");
              return;
            }

            // Clean the hash from the URL so tokens aren't leaked in history
            window.history.replaceState(null, "", window.location.pathname);
          }
        }

        // Verify session using getUser() (per project rules — prevents stale tokens)
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("[confirm-invite] No session after redirect:", userError?.message);
          setError("Could not verify your session. Please try the invite link again.");
          return;
        }

        // Success — redirect to set-password
        router.replace("/set-password");
      } catch (err) {
        console.error("[confirm-invite] Unexpected error:", err);
        setError("Something went wrong. Please try the invite link again.");
      }
    };

    handleInviteRedirect();
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
              Confirming your invitation...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
