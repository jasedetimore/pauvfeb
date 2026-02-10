"use client";

import React, { useState, useMemo } from "react";
import { colors } from "@/lib/constants/colors";
import { TradingFormSkeleton } from "@/components/atoms";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { calculateTokensForUsdp, calculateUsdpForTokens } from "@/lib/trading/formulas";

interface TradingFormSimpleProps {
  ticker: string;
  price?: number;
  priceStep?: number;
  onBuy?: (amount: number) => void;
  onSell?: (amount: number) => void;
  /** Fires immediately when order succeeds (before success message disappears) */
  onOrderConfirmed?: () => void;
  onOrderComplete?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  /** When false the issuer has no issuer_trading row yet */
  isTradable?: boolean;
  /** Hide the "Place Order" section header */
  hideTitle?: boolean;
}

/**
 * TradingFormSimple - Simple buy/sell form for trading
 * Allows users to enter amount and execute buy/sell orders
 */
export const TradingFormSimple: React.FC<TradingFormSimpleProps> = ({
  ticker,
  price,
  priceStep,
  onBuy,
  onSell,
  onOrderConfirmed,
  onOrderComplete,
  isLoading = false,
  disabled = false,
  isTradable = true,
  hideTitle = false,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<"buy" | "sell">("buy");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitStage, setSubmitStage] = useState<"idle" | "submitting" | "success">("idle");
  const [tickerHoldings, setTickerHoldings] = useState<number>(0);
  const [holdingsLoading, setHoldingsLoading] = useState(false);
  const [sellAllClicked, setSellAllClicked] = useState(false);

  // Get user auth context for USDP balance
  const { user, profile, isLoading: authLoading } = useAuth();
  const usdpBalance = profile?.usdp_balance ?? 0;

  // Fetch user's holdings for this ticker
  const fetchHoldings = React.useCallback(async () => {
    if (!user) {
      setTickerHoldings(0);
      return;
    }

    setHoldingsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("portfolio")
        .select("pv_amount")
        .eq("user_id", user.id)
        .eq("ticker", ticker.toUpperCase())
        .maybeSingle();

      if (error) {
        console.error("Error fetching holdings:", error);
        setTickerHoldings(0);
      } else {
        setTickerHoldings(data?.pv_amount ?? 0);
      }
    } catch (err) {
      console.error("Error fetching holdings:", err);
      setTickerHoldings(0);
    } finally {
      setHoldingsLoading(false);
    }
  }, [user, ticker]);

  React.useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  // Reset sellAllClicked when switching actions
  React.useEffect(() => {
    setSellAllClicked(false);
  }, [selectedAction]);

  const numericAmount = parseFloat(amount) || 0;
  
  // Use bonding curve formulas for accurate estimates
  // BUY: Tokens = (-CurrentPrice + SQRT(CurrentPrice^2 + 2 * price_step * USDP)) / price_step
  // SELL: USDP = avg_price * tokens (area under the curve)
  const estimatedPv = useMemo(() => {
    if (selectedAction !== "buy" || numericAmount <= 0 || !price || price <= 0) return 0;
    const step = priceStep ?? 0.01;
    try {
      return calculateTokensForUsdp(numericAmount, price, step);
    } catch {
      return 0;
    }
  }, [selectedAction, numericAmount, price, priceStep]);

  const estimatedUsdp = useMemo(() => {
    if (selectedAction !== "sell" || numericAmount <= 0 || !price || price <= 0) return 0;
    const step = priceStep ?? 0.01;
    try {
      return calculateUsdpForTokens(numericAmount, price, step);
    } catch {
      return 0;
    }
  }, [selectedAction, numericAmount, price, priceStep]);

  // For buy orders: user enters USDP amount
  // For sell orders: user enters PV amount
  const usdpAmount = selectedAction === "buy" ? numericAmount : estimatedUsdp;
  const pvAmount = selectedAction === "buy" ? estimatedPv : numericAmount;

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

    // For sell orders, check if user has enough PV tokens
    if (selectedAction === "sell" && numericAmount > tickerHoldings) {
      setSubmitError(`Insufficient ${ticker.toUpperCase()} balance`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitStage("submitting");
    const submitStartTime = Date.now();

    // Immediately notify parent so skeletons appear as soon as user confirms
    if (onOrderConfirmed) {
      onOrderConfirmed();
    }

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

      // Ensure "Submitting..." shows for at least 1.5s even if the request was fast
      const elapsed = Date.now() - submitStartTime;
      const remaining = Math.max(0, 1500 - elapsed);

      await new Promise((r) => setTimeout(r, remaining));

      // Transition to success stage
      setSubmitStage("success");

      // Call the callback if provided
      if (selectedAction === "buy" && onBuy) {
        onBuy(pvAmount);
      } else if (selectedAction === "sell" && onSell) {
        onSell(pvAmount);
      }

      // Refresh holdings in the form
      fetchHoldings();

      // Notify parent after success message disappears
      if (onOrderComplete) {
        setTimeout(() => onOrderComplete(), 1500);
      }

      // After a short pause, reset the form completely
      setTimeout(() => {
        setSubmitStage("idle");
        setAmount("");
      }, 1500);
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

  // Show skeleton when still loading
  if (isLoading) {
    return <TradingFormSkeleton />;
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
      {!hideTitle && (
        <div className="flex items-center justify-between px-1">
          <h2
            className="font-mono text-lg font-semibold"
            style={{ color: colors.textPrimary }}
          >
            Place Order
          </h2>
        </div>
      )}

      {/* Not Logged In Warning */}
      {!user && !authLoading && isTradable && (
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
        style={{
          backgroundColor: colors.background,
        }}
      >
        {/* Buy/Sell Toggle */}
        <div className="flex gap-1 mb-2">
          <button
            onClick={() => !disabled && setSelectedAction("buy")}
            className="flex-1 py-2 px-4 rounded-md font-mono font-medium transition-all"
            style={{
              backgroundColor:
                selectedAction === "buy"
                  ? disabled ? colors.textSecondary : colors.green
                  : "transparent",
              border: `1px solid ${selectedAction === "buy" ? (disabled ? colors.textSecondary : colors.green) : colors.boxOutline}`,
              color:
                selectedAction === "buy"
                  ? colors.textDark
                  : colors.textSecondary,
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            Buy
          </button>
          <button
            onClick={() => !disabled && setSelectedAction("sell")}
            className="flex-1 py-2 px-4 rounded-md font-mono font-medium transition-all"
            style={{
              backgroundColor:
                selectedAction === "sell"
                  ? disabled ? colors.textSecondary : colors.red
                  : "transparent",
              border: `1px solid ${selectedAction === "sell" ? (disabled ? colors.textSecondary : colors.red) : colors.boxOutline}`,
              color:
                selectedAction === "sell"
                  ? colors.textPrimary
                  : colors.textSecondary,
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            Sell
          </button>
        </div>

        {/* Amount Input */}
        <div className="mb-2">
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder={selectedAction === "buy" ? "Amount (USDP)" : "Amount (PV)"}
            disabled={disabled || isLoading || isSubmitting || !user}
            className="w-full px-4 py-3 rounded-md font-mono text-sm focus:outline-none transition-colors"
            style={{
              backgroundColor: colors.background,
              border: `1px solid ${colors.boxOutline}`,
              color: colors.textPrimary,
            }}
          />
        </div>

        {/* Sell All Button */}
        {selectedAction === "sell" && user && tickerHoldings > 0 && !sellAllClicked && (
          <div className="mb-1 mt-1 text-center">
            <button
              onClick={() => {
                setAmount(tickerHoldings.toFixed(4));
                setSellAllClicked(true);
              }}
              className="text-sm underline transition-opacity hover:opacity-80"
              style={{ color: colors.textPrimary }}
              type="button"
            >
              Sell All
            </button>
          </div>
        )}

        {/* Estimated Amount */}
        {numericAmount > 0 && price && (
          <div className="mb-1">
            <div className="flex justify-between text-sm">
              <span style={{ color: colors.textPrimary }}>
                {selectedAction === "buy" ? "Est. PV Received" : "Est. USDP Received"}
              </span>
              <span
                className="font-mono font-medium"
                style={{ color: colors.textPrimary }}
              >
                {selectedAction === "buy" 
                  ? `${pvAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} PV`
                  : formatCurrency(usdpAmount)
                }
              </span>
            </div>
            {selectedAction === "buy" && usdpAmount > usdpBalance && (
              <p
                className="text-xs mt-1"
                style={{ color: colors.red }}
              >
                Insufficient USDP balance
              </p>
            )}
            {selectedAction === "sell" && numericAmount > tickerHoldings && (
              <p
                className="text-xs mt-1"
                style={{ color: colors.red }}
              >
                Insufficient {ticker.toUpperCase()} balance
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {submitError && (
          <div
            className="mb-2 p-3 rounded-md"
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

        {/* Submit Button / Status Box */}
        {numericAmount > 0 && (
          <div className="mb-2">
            {submitStage !== "idle" ? (
              <div
                className="w-full py-2 rounded-md font-mono font-medium text-center text-sm"
                style={{
                  backgroundColor: submitStage === "success"
                    ? `${colors.green}20`
                    : `${colors.gold}20`,
                  border: `1px solid ${submitStage === "success" ? colors.green : colors.gold}`,
                  color: submitStage === "success" ? colors.green : colors.gold,
                }}
              >
                {submitStage === "submitting" ? "Submitting..." : "Successful"}
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={disabled || isLoading || !user}
                className="w-full py-2 rounded-md font-mono font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            )}
          </div>
        )}

        {/* Account Summary */}
        {user && (
          <div className="pb-2 -space-y-0.5">
            <div className="flex justify-between items-center">
              <span
                className="text-sm font-mono"
                style={{ color: colors.textSecondary }}
              >
                USDP Balance
              </span>
              <span
                className="font-mono font-normal"
                style={{ color: colors.textPrimary }}
              >
                {authLoading ? "..." : formatCurrency(usdpBalance)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span
                className="text-sm font-mono"
                style={{ color: colors.textSecondary }}
              >
                Your {ticker.toUpperCase()} Holdings
              </span>
              <span
                className="font-mono font-normal"
                style={{ color: colors.textPrimary }}
              >
                {holdingsLoading ? "..." : `${tickerHoldings.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} PV`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
