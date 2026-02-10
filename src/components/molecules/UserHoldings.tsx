"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";
import { UserHoldingsSkeleton } from "@/components/atoms";
import { useUserTransactions, UserTransaction } from "@/lib/hooks/useUserTransactions";

interface UserHoldingsProps {
  ticker: string;
  onRefetchRef?: (refetch: () => Promise<void>) => void;
  forceSkeleton?: boolean;
  onLoadingChange?: (isLoading: boolean) => void;
}

/**
 * Formats a date string to a readable format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a number to a currency string
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

/**
 * Formats PV amount with proper decimal places
 */
function formatPV(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

/**
 * Individual transaction row component
 */
const TransactionRow: React.FC<{ transaction: UserTransaction; isLast: boolean }> = ({
  transaction,
  isLast,
}) => {
  const isBuy = transaction.order_type === "buy";

  return (
    <div
      className="py-2 grid items-center justify-center grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)] overflow-hidden"
      style={{
        borderBottom: isLast ? "none" : `1px solid ${colors.boxOutline}`,
      }}
    >
      {/* BUY/SELL badge */}
      <span
        className="text-xs font-semibold px-2 py-1 rounded text-center w-[52px] justify-self-center"
        style={{
          backgroundColor: isBuy ? colors.green : colors.red,
          color: "#000000",
        }}
      >
        {isBuy ? "BUY" : "SELL"}
      </span>

      {/* USDP Change */}
      <span
        className="text-sm font-medium font-mono text-center truncate"
        style={{ color: colors.textSecondary }}
      >
        {isBuy ? "-" : "+"}{formatCurrency(transaction.amount_usdp)}
      </span>

      {/* PV Change */}
      <span
        className="text-sm font-medium font-mono text-center truncate"
        style={{ color: colors.textPrimary }}
      >
        {isBuy ? "+" : "-"}{formatPV(transaction.pv_traded)} PV
      </span>
    </div>
  );
};

/**
 * Empty state component when no transactions exist
 */
const EmptyState: React.FC = () => (
  <div
    className="text-center py-4"
    style={{ color: colors.textSecondary }}
  >
    <p className="text-sm">No holdings yet!</p>
    <p className="text-xs mt-1">Place an order to get started.</p>
  </div>
);

/**
 * Loading state component
 */
const LoadingState: React.FC = () => <UserHoldingsSkeleton />;

/**
 * UserHoldings - Displays transaction history for the current user and issuer
 * Shows BUY/SELL, amount in PV, cost basis, and date
 */
export const UserHoldings: React.FC<UserHoldingsProps> = ({
  ticker,
  onRefetchRef,
  forceSkeleton = false,
  onLoadingChange,
}) => {
  const { transactions, isLoading, error, refetch } = useUserTransactions(ticker);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Expose refetch to parent via callback ref
  React.useEffect(() => {
    if (onRefetchRef) {
      onRefetchRef(refetch);
    }
  }, [onRefetchRef, refetch]);

  React.useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const [result] = await Promise.all([
      refetch(),
      new Promise((r) => setTimeout(r, 600)),
    ]);
    setIsRefreshing(false);
  };

  const effectiveLoading = forceSkeleton || isLoading || isRefreshing;

  if (effectiveLoading) {
    return <UserHoldingsSkeleton />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2
          className="font-mono text-lg font-semibold"
          style={{ color: colors.textPrimary }}
        >
          Transaction History
        </h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-xs px-3 py-1 rounded transition-colors hover:opacity-80 disabled:opacity-50"
          style={{
            backgroundColor: colors.background,
            border: `1px solid ${colors.boxOutline}`,
            color: colors.textPrimary,
          }}
          title="Refresh transactions"
        >
          Refresh
        </button>
      </div>
      
      <div
        className="px-4 py-2 rounded-[10px]"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        {error ? (
          <div
            className="text-center py-4 text-xs"
            style={{ color: colors.red }}
          >
            Failed to load transactions
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            {transactions.map((tx, index) => (
              <TransactionRow 
                key={tx.id} 
                transaction={tx} 
                isLast={index === transactions.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
