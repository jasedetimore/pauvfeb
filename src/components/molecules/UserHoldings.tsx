"use client";

import React from "react";
import { colors } from "@/lib/constants/colors";
import { useUserTransactions, UserTransaction } from "@/lib/hooks/useUserTransactions";

interface UserHoldingsProps {
  ticker: string;
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats PV amount with proper decimal places
 */
function formatPV(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
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
      className="py-2 flex items-center justify-between"
      style={{
        borderBottom: isLast ? "none" : `1px solid ${colors.boxOutline}`,
      }}
    >
      {/* BUY/SELL badge */}
      <span
        className="text-xs font-semibold px-2 py-1 rounded"
        style={{
          backgroundColor: isBuy ? `${colors.green}20` : `${colors.red}20`,
          color: isBuy ? colors.green : colors.red,
        }}
      >
        {isBuy ? "BUY" : "SELL"}
      </span>

      {/* USDP Change */}
      <span
        className="text-sm font-medium font-mono"
        style={{ color: colors.textPrimary }}
      >
        {formatCurrency(transaction.amount_usdp)}
      </span>

      {/* PV Change */}
      <span
        className="text-sm font-medium font-mono"
        style={{ color: isBuy ? colors.green : colors.red }}
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
const LoadingState: React.FC = () => (
  <div
    className="text-center py-4"
    style={{ color: colors.textSecondary }}
  >
    <p className="text-sm">Loading transactions...</p>
  </div>
);

/**
 * UserHoldings - Displays transaction history for the current user and issuer
 * Shows BUY/SELL, amount in PV, cost basis, and date
 */
export const UserHoldings: React.FC<UserHoldingsProps> = ({ ticker }) => {
  const { transactions, isLoading, error } = useUserTransactions(ticker);

  return (
    <div>
      {/* Divider */}
      <div
        className="my-3"
        style={{
          height: "1px",
          backgroundColor: colors.boxOutline,
        }}
      />

      <h2
        className="font-mono text-lg font-semibold mb-3"
        style={{ color: colors.textPrimary }}
      >
        Transaction History
      </h2>
      
      <div
        className="px-4 py-2 rounded-[10px]"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        {isLoading ? (
          <LoadingState />
        ) : error ? (
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
