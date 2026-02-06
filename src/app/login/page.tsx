"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { colors } from "@/lib/constants/colors";
import { GoogleSignInButton } from "@/components/atoms/GoogleSignInButton";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get redirect URL from search params, default to home
  const redirectTo = searchParams.get("redirectTo") || "/";

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      // Successful login - redirect to intended destination and refresh to update server state
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  }

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.backgroundDark }}
      >
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: colors.gold }}
        />
      </div>
    );
  }

  // If user is logged in, don't render the form (redirect will happen)
  if (user) {
    return null;
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: colors.backgroundDark }}
    >
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Title - OUTSIDE BOX */}
          <h1
            className="text-2xl font-bold text-center mb-1"
            style={{ color: colors.textPrimary }}
          >
            Welcome Back
          </h1>
          <p
            className="text-center mb-4"
            style={{ color: colors.textSecondary }}
          >
            Sign in to your account
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
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
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
            </form>
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

          {/* Google Sign In - OUTSIDE BOX */}
          <div className="mt-2.5">
            <GoogleSignInButton redirectTo={redirectTo} />
          </div>

          {/* Sign Up Link - OUTSIDE BOX */}
          <p
            className="text-center mt-2.5"
            style={{ color: colors.textSecondary }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold hover:underline"
              style={{ color: colors.gold }}
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
