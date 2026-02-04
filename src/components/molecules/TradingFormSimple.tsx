"use client";

import React, { useState } from "react";
import { colors } from "@/lib/constants/colors";

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

  const numericAmount = parseFloat(amount) || 0;
  const estimatedTotal = numericAmount * (price || 0);

  // Format currency
  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleSubmit = () => {
    if (numericAmount <= 0) return;
    
    if (selectedAction === "buy" && onBuy) {
      onBuy(numericAmount);
    } else if (selectedAction === "sell" && onSell) {
      onSell(numericAmount);
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
            Amount (PV)
          </label>
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            disabled={disabled || isLoading}
            className="w-full px-4 py-3 rounded-md font-mono text-lg focus:outline-none transition-colors"
            style={{
              backgroundColor: colors.boxLight,
              border: `1px solid ${colors.boxOutline}`,
              color: colors.textPrimary,
            }}
          />
        </div>

        {/* Estimated Total */}
        {numericAmount > 0 && price && (
          <div
            className="mb-4 p-3 rounded-md"
            style={{ backgroundColor: colors.boxLight }}
          >
            <div className="flex justify-between text-sm">
              <span style={{ color: colors.textSecondary }}>Est. Total</span>
              <span
                className="font-mono font-medium"
                style={{ color: colors.textPrimary }}
              >
                {formatCurrency(estimatedTotal)}
              </span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || isLoading || numericAmount <= 0}
          className="w-full py-3 rounded-md font-mono font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor:
              selectedAction === "buy" ? colors.green : colors.red,
            color:
              selectedAction === "buy" ? colors.textDark : colors.textPrimary,
          }}
        >
          {isLoading
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
