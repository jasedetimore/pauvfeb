"use client";

import React, { useState } from "react";
import { colors } from "@/lib/constants/colors";
import { useAuth } from "@/lib/hooks/useAuth";

export default function DepositPage() {
  const { user, isLoading } = useAuth();
  const [amount, setAmount] = useState("");

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
          Please log in to deposit funds.
        </p>
      </div>
    );
  }

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual deposit logic
    alert(`Deposit of $${amount} USDP - Coming Soon!`);
    setAmount("");
  };

  return (
    <div className="space-y-6">
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
          Deposit
        </h1>

        {/* Info Banner */}
        <div
          className="p-4 rounded-lg mb-6 border"
          style={{
            backgroundColor: `${colors.gold}10`,
            borderColor: colors.gold,
          }}
        >
          <p
            className="text-sm"
            style={{ color: colors.gold }}
          >
            💡 Deposits are currently simulated. In the future, you&apos;ll be able to deposit real funds.
          </p>
        </div>

        {/* Deposit Form */}
        <form onSubmit={handleDeposit} className="space-y-6">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium mb-2"
              style={{ color: colors.textSecondary }}
            >
              Amount (USDP)
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-lg"
                style={{ color: colors.textMuted }}
              >
                $
              </span>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="0.01"
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors text-lg"
                style={{
                  backgroundColor: colors.boxLight,
                  borderColor: colors.boxOutline,
                  color: colors.textPrimary,
                }}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2">
            {[100, 500, 1000, 5000].map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => setAmount(quickAmount.toString())}
                className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor: colors.boxLight,
                  borderColor: colors.boxOutline,
                  color: colors.textPrimary,
                }}
              >
                ${quickAmount.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full py-3 rounded-lg font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: colors.gold,
              color: colors.textDark,
            }}
          >
            Deposit USDP
          </button>
        </form>

        {/* Payment Methods - Coming Soon */}
        <div className="mt-8 pt-6 border-t" style={{ borderColor: colors.boxOutline }}>
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: colors.textPrimary }}
          >
            Payment Methods
          </h2>
          
          <div
            className="p-6 rounded-lg border text-center"
            style={{
              backgroundColor: colors.boxLight,
              borderColor: colors.boxOutline,
            }}
          >
            <p style={{ color: colors.textSecondary }}>
              Payment integrations coming soon.
            </p>
            <p
              className="text-sm mt-2"
              style={{ color: colors.textMuted }}
            >
              Credit/Debit Cards, Bank Transfer, Crypto
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
