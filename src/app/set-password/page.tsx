"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/constants/colors";
import { SetPasswordForm } from "@/components/molecules/SetPasswordForm";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";

/**
 * /set-password page
 *
 * Displayed after an invited issuer clicks the confirmation link
 * and the PKCE code has been exchanged for a session.
 * The user must be authenticated (session exists) to see this page.
 */
export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Use getUser() for session hydration (per project rules)
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        // No valid session — redirect to login
        router.replace("/login?error=no_session");
        return;
      }

      setIsAuthenticated(true);
      setIsChecking(false);
    };

    checkAuth();
  }, [supabase, router]);

  if (isChecking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.backgroundDark }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Router will redirect
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ backgroundColor: colors.backgroundDark }}
    >
      <div
        className="w-full max-w-md rounded-xl p-8"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: colors.gold, fontFamily: "'EB Garamond', serif" }}
          >
            PAUV
          </h1>
          <h2
            className="text-lg font-semibold font-mono"
            style={{ color: colors.textPrimary }}
          >
            Set Your Password
          </h2>
          <p
            className="text-xs font-mono mt-2"
            style={{ color: colors.textSecondary }}
          >
            Choose a secure password for your Issuer account
          </p>
        </div>

        {/* Form */}
        <SetPasswordForm />
      </div>
    </div>
  );
}
