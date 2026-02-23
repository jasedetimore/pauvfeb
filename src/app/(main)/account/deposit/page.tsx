"use client";

import React, { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import WalletDepositsWithdrawalsSection from "@/components/organisms/WalletDepositsWithdrawalsSection";
import { WalletDepositsWithdrawalsSkeleton } from "@/components/atoms/Skeleton";
import { useAuth } from "@/lib/hooks/useAuth";
import { colors } from "@/lib/constants/colors";
import { WaitlistPanel } from "@/components/organisms/WaitlistPanel";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function DepositPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <WalletDepositsWithdrawalsSkeleton />;
  }

  if (!user) {
    return (
      <div
        className="rounded-lg p-6 text-center border"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.boxOutline,
        }}
      >
        <p className="font-mono" style={{ color: colors.textSecondary }}>
          Please log in to deposit funds.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Waitlist overlay – TODO: Hook up to Supabase waitlist API. See docs/WAITLIST_API.md */}
      <div className="absolute inset-0 z-20 flex items-start justify-center pt-12 px-4">
        <div
          className="w-full max-w-2xl rounded-xl border shadow-2xl"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.boxOutline,
          }}
        >
          <div className="px-6 pt-5 pb-1 text-center">
            <span
              className="font-mono text-lg font-semibold"
              style={{ color: colors.textPrimary }}
            >
              Deposits Coming at Launch
            </span>
          </div>
          <WaitlistPanel height={480} expanded />
        </div>
      </div>

      {/* Blurred background content */}
      <div className="pointer-events-none select-none" style={{ filter: "blur(6px)", opacity: 0.4 }}>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<WalletDepositsWithdrawalsSkeleton />}>
            <WalletDepositsWithdrawalsSection />
          </Suspense>
        </QueryClientProvider>
      </div>
    </div>
  );
}
