"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";
import { useAuth } from "@/lib/hooks/useAuth";

export default function AccountPage() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="rounded-lg p-6"
        style={{
          backgroundColor: colors.background,
        }}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded" style={{ backgroundColor: colors.boxLight }} />
          <div className="h-4 w-32 rounded" style={{ backgroundColor: colors.boxLight }} />
          <div className="h-4 w-64 rounded" style={{ backgroundColor: colors.boxLight }} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="rounded-lg p-6 text-center"
        style={{
          backgroundColor: colors.background,
        }}
      >
        <p style={{ color: colors.textSecondary }}>
          Please log in to view your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Info Card */}
      <div
        className="rounded-lg p-6"
        style={{
          backgroundColor: colors.background,
        }}
      >
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: colors.textPrimary }}
        >
          Account
        </h1>

        <div className="space-y-4">
          {/* Username */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: colors.textSecondary }}
            >
              Username
            </label>
            <p
              className="text-lg font-semibold"
              style={{ color: colors.textPrimary }}
            >
              {profile?.username || "—"}
            </p>
          </div>

          {/* Email */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: colors.textSecondary }}
            >
              Email
            </label>
            <p
              className="text-lg"
              style={{ color: colors.textPrimary }}
            >
              {user.email || "—"}
            </p>
          </div>

          {/* USDP Balance */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: colors.textSecondary }}
            >
              USDP Balance
            </label>
            <p
              className="text-lg font-semibold"
              style={{ color: colors.textPrimary }}
            >
              ${profile?.usdp_balance?.toLocaleString() || "0.00"} USDP
            </p>
          </div>

          {/* Member Since */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: colors.textSecondary }}
            >
              Member Since
            </label>
            <p style={{ color: colors.textPrimary }}>
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
