"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";
import { useAuth } from "@/lib/hooks/useAuth";

export default function AssetsPage() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="rounded-xl border p-6"
        style={{
          backgroundColor: colors.box,
          borderColor: colors.boxOutline,
        }}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 rounded" style={{ backgroundColor: colors.boxLight }} />
          <div className="h-20 w-full rounded" style={{ backgroundColor: colors.boxLight }} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="rounded-xl border p-6 text-center"
        style={{
          backgroundColor: colors.box,
          borderColor: colors.boxOutline,
        }}
      >
        <p style={{ color: colors.textSecondary }}>
          Please log in to view your assets.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* USDP Balance Card */}
      <div
        className="rounded-xl border p-6"
        style={{
          backgroundColor: colors.box,
          borderColor: colors.boxOutline,
        }}
      >
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: colors.textPrimary }}
        >
          Assets
        </h1>

        {/* Total Value */}
        <div
          className="p-4 rounded-lg mb-6"
          style={{ backgroundColor: colors.boxLight }}
        >
          <p
            className="text-sm mb-1"
            style={{ color: colors.textSecondary }}
          >
            Total Portfolio Value
          </p>
          <p
            className="text-3xl font-bold"
            style={{ color: colors.gold }}
          >
            ${profile?.usdp_balance?.toLocaleString() || "0.00"}
          </p>
        </div>

        {/* USDP */}
        <div className="space-y-4">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            Balances
          </h2>
          
          <div
            className="flex items-center justify-between p-4 rounded-lg border"
            style={{
              backgroundColor: colors.boxLight,
              borderColor: colors.boxOutline,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                style={{
                  backgroundColor: colors.gold,
                  color: colors.textDark,
                }}
              >
                $
              </div>
              <div>
                <p
                  className="font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  USDP
                </p>
                <p
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  Pauv Stable Coin
                </p>
              </div>
            </div>
            <p
              className="text-lg font-semibold"
              style={{ color: colors.textPrimary }}
            >
              {profile?.usdp_balance?.toLocaleString() || "0.00"}
            </p>
          </div>
        </div>

        {/* PV Holdings - Empty State */}
        <div className="mt-6 space-y-4">
          <h2
            className="text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            PV Holdings
          </h2>
          
          <div
            className="p-8 rounded-lg border text-center"
            style={{
              backgroundColor: colors.boxLight,
              borderColor: colors.boxOutline,
            }}
          >
            <p style={{ color: colors.textSecondary }}>
              You don&apos;t own any PV tokens yet.
            </p>
            <p
              className="text-sm mt-2"
              style={{ color: colors.textMuted }}
            >
              Start trading to build your portfolio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
