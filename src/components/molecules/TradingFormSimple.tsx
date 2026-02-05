"use client";

import React, { useState } from "react";
import { colors } from "@/lib/constants/colors";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

interface TradingFormSimpleProps {
  ticker: string;
  price?: number;
  onBuy?: (amount: number) => void;
  onSell?: (amount: number) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * TradingFormSimple - Simple buy/sell form for trading
 * Allows users to enter amount and execute buy/sell orders
 */
export const TradingFormSimple: React.FC<TradingFormSimpleProps> = ({
  ticker,
  price,
  onBuy,
  onSell,
  isLoading = false,
  disabled = false,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<"buy" | "sell">("buy");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Get user auth context for USDP balance
  const { user, profile, isLoading: authLoading } = useAuth();
  const usdpBalance = profile?.usdp_balance ?? 0;

  const numericAmount = parseFloat(amount) || 0;
  
  // For buy orders: user enters USDP, we calculate PV received
  // For sell orders: user enters PV, we calculate USDP received
  const usdpAmount = selectedAction === "buy" 
    ? numericAmount 
    : (price && price > 0 ? numericAmount * price : 0);
  const pvAmount = selectedAction === "buy" 
    ? (price && price > 0 ? numericAmount / price : 0) 
    : numericAmount;

  // Format currency
  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleSubmit = async () => {
    if (numericAmount <= 0) return;
    if (!user) {
      setSubmitError("Please log in to place orders");
      return;
    }

    // For buy orders, check if user has enough USDP
    if (selectedAction === "buy" && usdpAmount > usdpBalance) {
      setSubmitError("Insufficient USDP balance");
      return;
    }

    // TODO: For sell orders, check if user has enough PV tokens
    // This would require fetching the user's portfolio for this ticker

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const supabase = createClient();

      // Insert order into queue table
      // Buy: user enters USDP to spend, PV is blank (calculated at processing)
      // Sell: user enters PV to sell, USDP is blank (calculated at processing)
      const { error } = await supabase.from("queue").insert({
        user_id: user.id,
        ticker: ticker.toUpperCase(),
        order_type: selectedAction,
        amount_pv: selectedAction === "sell" ? numericAmount : 0,
        amount_usdp: selectedAction === "buy" ? numericAmount : 0,
        status: "pending",
      });

      if (error) {
        console.error("Queue insert error:", error);
        setSubmitError(error.message || "Failed to place order");
        return;
      }

      // Success - clear form and show success message
      setSubmitSuccess(true);
      setAmount("");
      
      // Call the callback if provided
      if (selectedAction === "buy" && onBuy) {
        onBuy(pvAmount);
      } else if (selectedAction === "sell" && onSell) {
        onSell(pvAmount);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      console.error("Order submission error:", err);
      setSubmitError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2
          className="font-mono text-lg font-semibold"
          style={{ color: colors.textPrimary }}
        >
          Place Order
        </h2>
      </div>

      {/* USDP Balance Display */}
      {user && (
        <div
          className="p-3 rounded-[10px]"
          style={{
            backgroundColor: colors.box,
            border: `1px solid ${colors.boxOutline}`,
          }}
        >
          <div className="flex justify-between items-center">
            <span
              className="text-sm font-mono"
              style={{ color: colors.textSecondary }}
            >
              USDP Balance
            </span>
            <span
              className="font-mono font-semibold"
              style={{ color: colors.gold }}
            >
              {authLoading ? "..." : formatCurrency(usdpBalance)}
            </span>
          </div>
        </div>
      )}

      {/* Not Logged In Warning */}
      {!user && !authLoading && (
        <div
          className="p-3 rounded-[10px]"
          style={{
            backgroundColor: `${colors.red}15`,
            border: `1px solid ${colors.red}`,
          }}
        >
          <p
            className="text-sm font-mono text-center"
            style={{ color: colors.red }}
          >
            Please log in to place orders
          </p>
        </div>
      )}

      {/* Form Container */}
      <div
        className="p-4 rounded-[10px]"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        {/* Buy/Sell Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedAction("buy")}
            className="flex-1 py-2 px-4 rounded-md font-mono font-medium transition-all"
            style={{
              backgroundColor:
                selectedAction === "buy" ? colors.green : "transparent",
              border: `1px solid ${selectedAction === "buy" ? colors.green : colors.boxOutline}`,
              color:
                selectedAction === "buy"
                  ? colors.textDark
                  : colors.textSecondary,
            }}
          >
            Buy
          </button>
          <button
            onClick={() => setSelectedAction("sell")}
            className="flex-1 py-2 px-4 rounded-md font-mono font-medium transition-all"
            style={{
              backgroundColor:
                selectedAction === "sell" ? colors.red : "transparent",
              border: `1px solid ${selectedAction === "sell" ? colors.red : colors.boxOutline}`,
              color:
                selectedAction === "sell"
                  ? colors.textPrimary
                  : colors.textSecondary,
            }}
          >
            Sell
          </button>
        </div>

        {/* Amount Input */}
        <div className="space-y-2 mb-4">
          <label
            className="text-xs uppercase font-light"
            style={{ color: colors.textSecondary }}
          >
            {selectedAction === "buy" ? "Amount (USDP)" : "Amount (PV)"}
          </label>
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            disabled={disabled || isLoading || isSubmitting || !user}
            className="w-full px-4 py-3 rounded-md font-mono text-lg focus:outline-none transition-colors"
            style={{
              backgroundColor: colors.boxLight,
              border: `1px solid ${colors.boxOutline}`,
              color: colors.textPrimary,
            }}
          />
        </div>

        {/* Estimated Amount */}
        {numericAmount > 0 && price && (
          <div
            className="mb-4 p-3 rounded-md"
            style={{ backgroundColor: colors.boxLight }}
          >
            <div className="flex justify-between text-sm">
              <span style={{ color: colors.textSecondary }}>
                {selectedAction === "buy" ? "Est. PV Received" : "Est. USDP Received"}
              </span>
              <span
                className="font-mono font-medium"
                style={{ color: colors.textPrimary }}
              >
                {selectedAction === "buy" 
                  ? `${pvAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })} PV`
                  : formatCurrency(usdpAmount)
                }
              </span>
            </div>
            {selectedAction === "buy" && usdpAmount > usdpBalance && (
              <p
                className="text-xs mt-2"
                style={{ color: colors.red }}
              >
                Insufficient USDP balance
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {submitError && (
          <div
            className="mb-4 p-3 rounded-md"
            style={{ backgroundColor: `${colors.red}15` }}
          >
            <p
              className="text-sm font-mono"
              style={{ color: colors.red }}
            >
              {submitError}
            </p>
          </div>
        )}

        {/* Success Message */}
        {submitSuccess && (
          <div
            className="mb-4 p-3 rounded-md"
            style={{ backgroundColor: `${colors.green}15` }}
          >
            <p
              className="text-sm font-mono"
              style={{ color: colors.green }}
            >
              Order placed successfully! 🎉
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || isLoading || isSubmitting || numericAmount <= 0 || !user}
          className="w-full py-3 rounded-md font-mono font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor:
              selectedAction === "buy" ? colors.green : colors.red,
            color:
              selectedAction === "buy" ? colors.textDark : colors.textPrimary,
          }}
        >
          {isSubmitting
            ? "Placing Order..."
            : isLoading
            ? "Processing..."
            : `${selectedAction === "buy" ? "Buy" : "Sell"} ${ticker.toUpperCase()}`}
        </button>

        {/* Disclaimer */}
        <p
          className="text-xs text-center mt-3"
          style={{ color: colors.textSecondary }}
        >
          Trading is simulated. No real money involved.
        </p>
      </div>
    </div>
  );
};
