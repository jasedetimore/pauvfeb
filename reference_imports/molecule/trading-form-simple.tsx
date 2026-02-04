import React, { useState, useEffect, useCallback } from "react";
import { useMyWallet } from "@/hooks/use-wallet";
import { useHolderStatus } from "@/hooks/use-holder-status";
import { useAuthFast } from "@/hooks/use-auth-fast";
import { useEstimateOrder } from "@/hooks/use-estimate-order";
import { useDebounce } from "@/hooks/useDebounce";
import { ErrorModal } from "./error-modal";
import { PnlDisplay } from "./pnl-display";

interface TradingFormSimpleProps {
  pvAmount: string;
  setPvAmount: (value: string) => void;
  onBuy: () => void;
  onSell: () => void;
  submitting: boolean;
  selectedTradeId: string | null;
  onBackToLive: () => void;
  tradeError: string | null;
  processingInfo: { iterations: number; processed: boolean } | null;
  ticker?: string;
  price?: number;
  queuedOrders?: Set<string>;
  processingOrderType?: "buy" | "sell" | null;
  pnlProcessingOrders?: Set<string>;
}

export const TradingFormSimple: React.FC<TradingFormSimpleProps> = ({
  pvAmount,
  setPvAmount,
  onBuy,
  onSell,
  submitting,
  selectedTradeId,
  onBackToLive,
  tradeError,
  processingInfo,
  ticker,
  price,
  queuedOrders = new Set(),
  processingOrderType = null,
  pnlProcessingOrders = new Set(),
}) => {
  const [localPvAmount, setLocalPvAmount] = useState(pvAmount);
  const [selectedAction, setSelectedAction] = useState<"buy" | "sell" | null>(
    "buy"
  );
  const [activeButton, setActiveButton] = useState<"buy" | "sell" | null>("buy");
  const [orderUiStage, setOrderUiStage] = useState<"idle" | "submitting" | "processing" | "success">("idle");
  const [successOrderType, setSuccessOrderType] = useState<"buy" | "sell" | null>(null);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  // Use fast auth hook for immediate user data access
  const {
    userId,
    isAuthenticated: currentlyAuthenticated,
    session,
  } = useAuthFast();

  const {
    data: wallet,
    isLoading: walletLoading,
    isError: walletError,
    isRefetching: walletRefetching,
    refetch: refetchWallet,
  } = useMyWallet(userId, session);

  const {
    data: holderStatus,
    isLoading: holderStatusLoading,
    isError: holderStatusError,
    isFetching: holderStatusFetching,
    refetch: refetchHolderStatus,
  } = useHolderStatus(userId, ticker, session);

  // Debounce the quantity for cost estimation (wait 500ms after user stops typing)
  const debouncedQuantity = useDebounce(parseFloat(localPvAmount) || 0, 500);

  // Get real-time cost estimation for buy orders
  const { data: estimatedCost, isLoading: isEstimating } = useEstimateOrder({
    ticker: ticker || "",
    orderType: selectedAction === "sell" ? "sell" : "buy",
    quantity: debouncedQuantity,
    enabled: !!ticker && debouncedQuantity > 0 && !!selectedAction,
  });

  const walletBalance = wallet?.balance
    ? parseFloat(String(wallet?.balance))
    : 0;

  const isHolder = holderStatus?.is_holder || true;
  const heldQuantity = holderStatus?.quantity
    ? parseFloat(holderStatus.quantity)
    : 0;

  // Sync with parent
  useEffect(() => {
    setLocalPvAmount(pvAmount);
  }, [pvAmount]);

  useEffect(() => {
    if (selectedTradeId) {
      setSelectedAction(null);
      setActiveButton(null);
      setLocalPvAmount("");
      setPvAmount("");
      setOrderUiStage("idle");
      return;
    }

    if (!selectedTradeId && !selectedAction) {
      setSelectedAction("buy");
      setActiveButton("buy");
    }
  }, [selectedTradeId, selectedAction, setPvAmount]);

  const hasProcessingOrders =
    queuedOrders.size > 0 || pnlProcessingOrders.size > 0 || !!processingOrderType;

  const resetPostOrderState = useCallback(() => {
    setOrderUiStage("idle");
    setSelectedAction("buy");
    setActiveButton("buy");
    setLocalPvAmount("");
    setPvAmount("");
  }, [setPvAmount]);

  useEffect(() => {
    if (selectedTradeId) {
      return;
    }

    if (submitting) {
      setOrderUiStage("submitting");
      return;
    }

    if (!submitting && hasProcessingOrders) {
      setOrderUiStage("processing");
      return;
    }

    if (
      !submitting &&
      !hasProcessingOrders &&
      orderUiStage === "processing"
    ) {
      // Transition to success state
      setOrderUiStage("success");
      setSuccessOrderType(processingOrderType);
    }
  }, [
    submitting,
    hasProcessingOrders,
    orderUiStage,
    resetPostOrderState,
    selectedTradeId,
    processingOrderType,
  ]);

  // Handle success state timeout
  useEffect(() => {
    if (orderUiStage === "success") {
      const successTimeout = setTimeout(() => {
        resetPostOrderState();
        setSuccessOrderType(null);
      }, 4000);
      
      return () => clearTimeout(successTimeout);
    }
  }, [orderUiStage, resetPostOrderState]);

  // Validate numeric input with comma formatting
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === "") return setLocalPvAmount("");

      // Remove commas to get the raw number
      const rawValue = value.replace(/,/g, "");

      // Check if it's a valid number format
      const numericRegex = /^(\d+)?\.?\d*$/;
      if (
        numericRegex.test(rawValue) &&
        !(rawValue.startsWith("00") && !rawValue.startsWith("0."))
      ) {
        // Store the raw value (without commas) for calculations
        setLocalPvAmount(rawValue);
      }
    },
    []
  );

  const handleBlur = useCallback(() => {
    let cleanValue = localPvAmount;
    if (cleanValue.endsWith(".")) cleanValue = cleanValue.slice(0, -1);
    if (cleanValue !== localPvAmount) setLocalPvAmount(cleanValue);
    if (cleanValue !== pvAmount) setPvAmount(cleanValue);
  }, [localPvAmount, pvAmount, setPvAmount]);

  // Format number with commas for display
  const formatNumberWithCommas = (value: string): string => {
    if (!value) return "";
    const parts = value.split(".");
    // Add commas to the integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  const displayValue = formatNumberWithCommas(localPvAmount);

  const handleSelectAction = useCallback(
    (action: "buy" | "sell") => {
      if (submitting || !!selectedTradeId || orderUiStage !== "idle") {
        return;
      }

      setSelectedAction(action);
      setActiveButton(action);
    },
    [orderUiStage, selectedTradeId, submitting]
  );

  const handleSubmitOrder = useCallback(() => {
    if (!selectedAction || orderUiStage !== "idle") {
      return;
    }

    if (!currentlyAuthenticated || !userId) {
      setErrorModal({
        isOpen: true,
        title: "Authentication Required",
        message: "Please login to trade",
      });
      return;
    }

    const quantity = parseFloat(localPvAmount);
    if (!quantity || quantity <= 0) {
      setErrorModal({
        isOpen: true,
        title: "Invalid Quantity",
        message: "Enter a valid PV quantity before submitting.",
      });
      return;
    }

    if (selectedAction === "buy") {
      if (!walletBalance || walletBalance <= 0) {
        setErrorModal({
          isOpen: true,
          title: "Insufficient Balance",
          message: "Insufficient wallet balance. Please add funds to your wallet.",
        });
        return;
      }
    } else {
      if (!isHolder || heldQuantity <= 0) {
        setErrorModal({
          isOpen: true,
          title: "Cannot Sell",
          message: `You cannot sell ${ticker} because you do not hold any. Please buy some first.`,
        });
        return;
      }
      if (quantity > heldQuantity) {
        setErrorModal({
          isOpen: true,
          title: "Insufficient Holdings",
          message: `Insufficient holdings. You hold ${heldQuantity} ${ticker} but are trying to sell ${quantity}`,
        });
        return;
      }
    }

    if (
      (selectedAction === "buy" &&
        processingOrderType === "buy" &&
        (queuedOrders.size > 0 || pnlProcessingOrders.size > 0)) ||
      (selectedAction === "sell" &&
        processingOrderType === "sell" &&
        (queuedOrders.size > 0 || pnlProcessingOrders.size > 0))
    ) {
      return;
    }

    setOrderUiStage("submitting");
    setActiveButton(selectedAction);
    if (refetchWallet) {
      refetchWallet();
    }
    if (refetchHolderStatus) {
      refetchHolderStatus();
    }
    setPvAmount(localPvAmount);
    if (selectedAction === "buy") {
      onBuy();
    } else {
      onSell();
    }
  }, [
    orderUiStage,
    selectedAction,
    currentlyAuthenticated,
    userId,
    localPvAmount,
    walletBalance,
    isHolder,
    heldQuantity,
    ticker,
    processingOrderType,
    queuedOrders.size,
    pnlProcessingOrders.size,
    refetchHolderStatus,
    refetchWallet,
    onBuy,
    onSell,
    setPvAmount,
  ]);

  const parsedQuantity = parseFloat(localPvAmount);
  const hasQuantity = !!selectedAction && Number.isFinite(parsedQuantity) && parsedQuantity > 0;
  const showOrderDetails = hasQuantity;
  const isSellAction = selectedAction === "sell";
  const estimatedLabel = isSellAction ? "Estimated Return" : "Estimated Cost";
  const estimatedSign = isSellAction ? "+" : "-";
  const estimatedValueClass = isSellAction
    ? "text-emerald-400"
    : "text-red-400";
  const showEstimateContainer = showOrderDetails;
  const showQuantityContainer = Boolean(selectedAction);
  const walletDisplayLoading = walletLoading || walletRefetching || orderUiStage !== "idle";
  const holdingsDisplayLoading = holderStatusLoading || holderStatusFetching || orderUiStage !== "idle";
  const tradingLocked = orderUiStage !== "idle" || submitting || !!selectedTradeId;
  const buyButtonDisabled = tradingLocked || selectedAction === null;
  const sellButtonDisabled = tradingLocked || selectedAction === null;
  const buyButtonTone = tradingLocked
    ? "bg-emerald-900"
    : activeButton === "buy"
      ? "ring-2 ring-emerald-200"
      : "";
  const sellButtonTone = tradingLocked
    ? "bg-red-900"
    : activeButton === "sell"
      ? "ring-2 ring-red-200"
      : "";
  const submitDisabled =
    orderUiStage !== "idle" ||
    !selectedAction ||
    submitting ||
    !!selectedTradeId ||
    !currentlyAuthenticated ||
    !userId ||
    (selectedAction === "buy" &&
      (walletLoading || !walletBalance || walletBalance <= 0)) ||
    (selectedAction === "sell" &&
      (holderStatusLoading || !isHolder || heldQuantity <= 0)) ||
    (selectedAction === "buy" &&
      processingOrderType === "buy" &&
      (queuedOrders.size > 0 || pnlProcessingOrders.size > 0)) ||
    (selectedAction === "sell" &&
      processingOrderType === "sell" &&
      (queuedOrders.size > 0 || pnlProcessingOrders.size > 0));
  const submitButtonTone =
    orderUiStage === "idle"
      ? selectedAction === "sell"
        ? "bg-red-600 hover:bg-red-500 text-white"
        : "bg-emerald-600 hover:bg-emerald-500 text-white"
      : "bg-neutral-800 text-neutral-200";
  const submitButtonLabel =
    orderUiStage === "submitting"
      ? "Submitting order"
      : orderUiStage === "processing"
        ? "Processing order"
        : orderUiStage === "success"
          ? "Order Successful!"
          : `Submit ${selectedAction === "sell" ? "Sell" : "Buy"} Order`;

  return (
    <>
      {selectedTradeId && (
        <div className="flex items-start justify-between gap-2 p-2 rounded bg-amber-900/30 text-amber-200 text-[11px]">
          <div className="flex-1">
            Viewing historical trade (ID: {selectedTradeId.slice(0, 8)}…) —
            Buy/Sell disabled.
          </div>
          <button
            onClick={onBackToLive}
            className="px-2 py-0.5 rounded text-white text-[11px] bg-neutral-700"
          >
            Back to Live
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleSelectAction("buy")}
          disabled={buyButtonDisabled}
          className={`flex-1 px-4 py-2 rounded-[9px] text-black font-semibold tracking-wide text-base transition-all ${buyButtonTone} ${buyButtonDisabled ? "opacity-60 cursor-not-allowed" : ""
            }`}
          style={{ backgroundColor: '#6DE8B9' }}
        >
          Buy
        </button>

        <button
          type="button"
          onClick={() => handleSelectAction("sell")}
          disabled={sellButtonDisabled}
          className={`flex-1 px-4 py-2 rounded-[9px] text-black font-semibold tracking-wide text-base transition-all ${sellButtonTone} ${sellButtonDisabled ? "opacity-60 cursor-not-allowed" : ""
            }`}
          style={{ backgroundColor: '#EF4341' }}
        >
          Sell
        </button>
      </div>

      {showQuantityContainer && (
        <div className="mt-3">
          <input
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="Enter PV quantity"
            className="w-full border border-neutral-700 px-2 py-2 rounded-[9px] bg-black font-mono text-sm disabled:opacity-40"
            disabled={orderUiStage !== "idle" || !!selectedTradeId}
          />
          {selectedAction === "sell" && heldQuantity > 0 && (
            <button
              onClick={() => {
                if (orderUiStage === "idle" && !selectedTradeId) {
                  setLocalPvAmount(String(heldQuantity));
                  setPvAmount(String(heldQuantity));
                }
              }}
              disabled={orderUiStage !== "idle" || !!selectedTradeId}
              className="w-full text-md text-white underline hover:text-neutral-200 cursor-pointer transition-colors mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sell All
            </button>
          )}
        </div>
      )}

      {/* Real-time Cost Estimation */}
      {showEstimateContainer && (
        <div className="mt-3 rounded-lg bg-black border border-neutral-700/50 px-2 py-1.5">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-400">{estimatedLabel}:</span>
              {isEstimating || !estimatedCost ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-20 rounded bg-neutral-700/50 animate-pulse"></span>
                </span>
              ) : (
                <span className={`text-base font-mono font-semibold ${estimatedValueClass}`}>
                  {estimatedSign}${estimatedCost?.estimated_cost?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
            <div className="text-xs text-neutral-500 space-y-0.5">
              <div className="flex justify-between">
                <span>Base:</span>
                <span className="font-mono">
                  {isEstimating || !estimatedCost ? (
                    <span className="inline-block h-3 w-14 rounded bg-neutral-700/40 animate-pulse"></span>
                  ) : (
                    `$${(estimatedCost?.breakdown?.base_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fees:</span>
                <span className="font-mono">
                  {isEstimating || !estimatedCost ? (
                    <span className="inline-block h-3 w-14 rounded bg-neutral-700/40 animate-pulse"></span>
                  ) : (
                    `$${(
                      (estimatedCost?.breakdown?.issuer_fee || 0) +
                      (estimatedCost?.breakdown?.server_fee || 0)
                    ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Spread:</span>
                <span className="font-mono">
                  {isEstimating || !estimatedCost ? (
                    <span className="inline-block h-3 w-14 rounded bg-neutral-700/40 animate-pulse"></span>
                  ) : (
                    `$${(estimatedCost?.breakdown?.spread || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Order Button */}
      {showOrderDetails && hasQuantity && (
        <button
          type="button"
          onClick={handleSubmitOrder}
          disabled={submitDisabled}
          className={`w-full mt-3 px-4 py-1 rounded-[9px] font-bold tracking-wide text-sm transition-colors ${submitButtonTone} ${submitDisabled ? "opacity-60 cursor-not-allowed" : ""
            }`}
        >
          {submitButtonLabel}
        </button>
      )}

      {/* Spacer Divider */}
      {currentlyAuthenticated && orderUiStage !== "success" && (
        <div className="mt-4 mb-3 border-t border-neutral-700"></div>
      )}

      {/* Order Success Message */}
      {orderUiStage === "success" && (
        <div className="mt-4 p-4 rounded-lg bg-neutral-800 border border-neutral-600">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6DE8B9' }}>
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: '#6DE8B9' }}>
                {successOrderType === "buy" ? "Buy" : "Sell"} Order Successful!
              </div>
              <div className="text-sm text-neutral-300">
                Your order has been processed
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Info */}
      {currentlyAuthenticated && orderUiStage !== "success" && (
        <div className="pl-0.5 text-[13px] text-neutral-400">
          {walletError && !walletDisplayLoading ? (
            <div className="text-red-500">
              Failed to load wallet.{" "}
              <button className="underline" onClick={() => refetchWallet()}>
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center min-h-[20px]">
                {walletDisplayLoading ? (
                  <div className="h-4 w-[200px] rounded bg-neutral-700/40 animate-pulse"></div>
                ) : (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span>Wallet Balance:</span>
                    <span className="font-mono">
                      ${walletBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                    </span>
                    {walletRefetching && (
                      <span className="text-[11px] text-neutral-500">
                        (refreshing…)
                      </span>
                    )}
                  </div>
                )}
              </div>
              {ticker && (
                <div className="flex items-center min-h-[20px]">
                  {holderStatusError && !holdingsDisplayLoading ? (
                    <span className="text-red-400 text-xs">
                      Failed to load holdings
                    </span>
                  ) : holdingsDisplayLoading ? (
                    <div className="h-4 w-[220px] rounded bg-neutral-700/30 animate-pulse"></div>
                  ) : (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span>Current Holdings:</span>
                      <span className="font-mono">
                        {heldQuantity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {ticker}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Extra States */}
      {!currentlyAuthenticated && (
        <div className="text-xs text-red-500 mt-2">Login to trade.</div>
      )}
      {currentlyAuthenticated && !walletLoading && walletBalance <= 0 && (
        <div className="text-xs text-amber-600 mt-1">
          Insufficient balance. Please add funds to your wallet.
        </div>
      )}
      {tradeError && (
        <div className="text-xs text-red-500 break-words mt-1">
          {tradeError}
          {tradeError.includes("may have completed") && (
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.reload();
                }
              }}
              className="ml-2 underline text-blue-400 hover:text-blue-300"
            >
              Refresh Page
            </button>
          )}
        </div>
      )}

      {/* Queue Status Display - Only show if we have active queued orders */}
      {/* {processingInfo && !selectedTradeId && queuedOrders.size > 0 && (
        <div className="mt-3 p-3 rounded-lg border bg-black border-neutral-600">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-neutral-200">
                {`${processingOrderType?.toUpperCase()} Order Queued for Processing`}
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">
                {`Position in queue: ${processingInfo.iterations} | Waiting for processing...`}
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Active Queue Orders Info */}
      {/* {processingOrderType && !processingInfo && (
        <div className="mt-2 p-2 rounded bg-amber-900/20 border border-amber-700/30">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
            <div className="text-xs text-amber-200">
              {processingOrderType.toUpperCase()} order processing...
            </div>
          </div>
        </div>
      )} */}

      {/* PnL Display */}
      {/* {currentlyAuthenticated && ticker && (
        <div className="mt-3">
          <PnlDisplay ticker={ticker} compact={true} />
        </div>
      )} */}

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ isOpen: false, title: "", message: "" })}
      />
    </>
  );
};
