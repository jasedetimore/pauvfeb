"use client";

import React, { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import WalletDepositsWithdrawalsSection from "@/components/organisms/WalletDepositsWithdrawalsSection";
import { WalletDepositsWithdrawalsSkeleton } from "@/components/atoms/Skeleton";
import { useAuth } from "@/lib/hooks/useAuth";
import { colors } from "@/lib/constants/colors";

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
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<WalletDepositsWithdrawalsSkeleton />}>
        <WalletDepositsWithdrawalsSection />
      </Suspense>
    </QueryClientProvider>
  );
}
