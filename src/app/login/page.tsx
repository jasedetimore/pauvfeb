"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/constants/colors";
import { Logo } from "@/components/atoms/Logo";
import { signIn } from "@/app/auth/actions";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signIn(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // If successful, the server action will redirect
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: colors.backgroundDark }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl border"
        style={{
          backgroundColor: colors.box,
          borderColor: colors.boxOutline,
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo height={40} />
          </Link>
        </div>

        {/* Title */}
        <h1
          className="text-2xl font-bold text-center mb-2"
          style={{ color: colors.textPrimary }}
        >
          Welcome Back
        </h1>
        <p
          className="text-center mb-8"
          style={{ color: colors.textSecondary }}
        >
          Sign in to your account
        </p>

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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2"
              style={{ color: colors.textSecondary }}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
              style={{
                backgroundColor: colors.boxLight,
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
              style={{ color: colors.textSecondary }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors"
              style={{
                backgroundColor: colors.boxLight,
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

        {/* Divider */}
        <div className="my-8 flex items-center">
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

        {/* Sign Up Link */}
        <p
          className="text-center"
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
  );
}
