"use client";

import React, { useState } from "react";
import Link from "next/link";
import { colors } from "@/lib/constants/colors";
import { GoogleSignInButton } from "@/components/atoms/GoogleSignInButton";
import { signUp } from "@/app/auth/actions";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setRequiresEmailConfirmation(false);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    // Client-side validation
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    const result = await signUp(formData);

    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(result.message || "Account created successfully!");
      setRequiresEmailConfirmation(Boolean(result.requiresEmailConfirmation));
    }
    
    setIsLoading(false);
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: colors.backgroundDark }}
    >
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Title - OUTSIDE BOX */}
          <h1
            className="text-2xl font-bold text-center mb-1"
            style={{ color: colors.textPrimary }}
          >
            Create Account
          </h1>
          <p
            className="text-center mb-4"
            style={{ color: colors.textSecondary }}
          >
            Join Pauv and start trading
          </p>

          {/* Box - containing only form */}
          <div
            className="p-8 rounded-lg border"
            style={{
              backgroundColor: colors.box,
              borderColor: colors.boxOutline,
            }}
          >
            {/* Error Message */}
            {error && (
              <div
                className="mb-6 p-4 rounded-lg border"
                style={{
                  backgroundColor: `${colors.red}20`,
                  borderColor: colors.red,
                  color: colors.red,
                }}
              >
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div
                className="mb-6 p-4 rounded-lg border"
                style={{
                  backgroundColor: `${colors.green}20`,
                  borderColor: colors.green,
                  color: colors.green,
                }}
              >
                {success}
                {!requiresEmailConfirmation && (
                  <p className="mt-2 text-sm">
                    <Link
                      href="/login"
                      className="underline font-semibold"
                    >
                      Click here to login
                    </Link>
                  </p>
                )}
              </div>
            )}

            {/* Form */}
            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-2"
                style={{ color: colors.textPrimary }}
              >
                Username<span style={{ color: colors.red }}> *</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: colors.box,
                  borderColor: colors.boxOutline,
                  color: colors.textPrimary,
                }}
                placeholder="johndoe"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: colors.textPrimary }}
              >
                Email<span style={{ color: colors.red }}> *</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: colors.box,
                  borderColor: colors.boxOutline,
                  color: colors.textPrimary,
                }}
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: colors.textPrimary }}
              >
                Password<span style={{ color: colors.red }}> *</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: colors.box,
                  borderColor: colors.boxOutline,
                  color: colors.textPrimary,
                }}
                placeholder="••••••••"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2"
                style={{ color: colors.textPrimary }}
              >
                Confirm Password<span style={{ color: colors.red }}> *</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: colors.box,
                  borderColor: colors.boxOutline,
                  color: colors.textPrimary,
                }}
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: colors.gold,
                color: colors.textDark,
              }}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
              </form>
            )}
          </div>

          {/* Divider - OUTSIDE BOX */}
          <div className="my-0 mt-2.5 flex items-center">
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: colors.boxOutline }}
            />
            <span
              className="px-4 text-sm"
              style={{ color: colors.textMuted }}
            >
              or
            </span>
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: colors.boxOutline }}
            />
          </div>

          {/* Google Sign Up - OUTSIDE BOX */}
          <div className="mt-2.5">
            <GoogleSignInButton label="Sign up with Google" />
          </div>

          {/* Sign In Link - OUTSIDE BOX */}
          <p
            className="text-center mt-2.5"
            style={{ color: colors.textSecondary }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold hover:underline"
              style={{ color: colors.gold }}
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
