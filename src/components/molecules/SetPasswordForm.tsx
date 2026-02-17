"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/constants/colors";
import { Input } from "@/components/atoms/Input";
import { PrimaryButton } from "@/components/atoms/PrimaryButton";
import { createClient } from "@/lib/supabase/client";

/**
 * SetPasswordForm — Molecule for invited issuers to set their password.
 *
 * After the invite PKCE flow establishes a session, this form lets
 * the user choose a password. On success it links auth.uid() to the
 * matching issuer_details row and redirects to the issuer dashboard.
 */
export function SetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // ── Validation ──
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Hydrate the current session to prevent stale tokens
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Your session has expired. Please use the invite link again.");
        setIsLoading(false);
        return;
      }

      // 2. Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || "Failed to set password");
        setIsLoading(false);
        return;
      }

      // 3. Link auth.uid() → issuer_details where email matches
      //    This is done via the server API to use service_role (bypasses RLS)
      const linkRes = await fetch("/api/claim-account/link-issuer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });

      if (!linkRes.ok) {
        const result = await linkRes.json();
        console.error("Link issuer error:", result.error);
        // Don't block — the link can be fixed later by an admin
      }

      // 4. Redirect to issuer dashboard
      router.push("/account/issuer-dashboard");
      router.refresh();
    } catch (err) {
      console.error("SetPasswordForm error:", err);
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Password */}
      <Input
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
      />

      {/* Confirm Password */}
      <Input
        label="Confirm Password"
        type="password"
        placeholder="Re-enter your password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
      />

      {/* Error */}
      {error && (
        <p
          className="text-xs font-mono px-3 py-2 rounded"
          style={{
            color: colors.red,
            backgroundColor: `${colors.red}15`,
            border: `1px solid ${colors.red}30`,
          }}
        >
          {error}
        </p>
      )}

      {/* Submit */}
      <PrimaryButton type="submit" isLoading={isLoading} fullWidth>
        {isLoading ? "Setting Password..." : "Set Password & Continue"}
      </PrimaryButton>
    </form>
  );
}
