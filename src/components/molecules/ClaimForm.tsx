"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/constants/colors";
import { Input } from "@/components/atoms/Input";
import { PrimaryButton } from "@/components/atoms/PrimaryButton";
import { createClient } from "@/lib/supabase/client";

interface ClaimFormProps {
  email: string;
  issuerName: string;
  issuerTicker: string;
  token: string;
}

/**
 * ClaimForm — Molecule for the issuer claim account flow.
 * Pre-fills the email, lets the user set a password, and
 * creates their account + logs them in automatically.
 */
export function ClaimForm({ email, issuerName, issuerTicker, token }: ClaimFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
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
      // 1. Call the claim API to create the user account
      const res = await fetch("/api/claim-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(result.error || "Failed to create account");
        setIsLoading(false);
        return;
      }

      // 2. Auto-login using the credentials just created
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("Account created but auto-login failed. Please log in manually.");
        setIsLoading(false);
        router.push("/login");
        return;
      }

      // 3. Redirect to the issuer dashboard
      router.push(`/issuer/${issuerTicker}`);
      router.refresh();
    } catch (err) {
      console.error("Claim form error:", err);
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Issuer name badge */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-md"
        style={{ backgroundColor: colors.boxLight, border: `1px solid ${colors.boxOutline}` }}
      >
        <span
          className="text-xs font-mono font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: colors.gold, color: colors.textDark }}
        >
          {issuerTicker}
        </span>
        <span className="text-sm font-mono" style={{ color: colors.textPrimary }}>
          {issuerName}
        </span>
      </div>

      {/* Email — read-only */}
      <Input
        label="Email"
        type="email"
        value={email}
        readOnly
        style={{
          backgroundColor: colors.boxLight,
          opacity: 0.7,
          cursor: "not-allowed",
        }}
      />

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

      {/* Error message */}
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
        {isLoading ? "Creating Account..." : "Claim Your Profile"}
      </PrimaryButton>
    </form>
  );
}
