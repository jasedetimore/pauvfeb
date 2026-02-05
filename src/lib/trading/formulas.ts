/**
 * Trading Formula Utilities
 * Uses a linear bonding curve model for PV token pricing
 * 
 * Formula for BUY (USDP to PV):
 * Tokens = (-CurrentPrice + SQRT(CurrentPrice^2 + 2 * price_step * USDP)) / price_step
 * 
 * Formula for SELL (PV to USDP):
 * USDP = Tokens * CurrentPrice - (price_step * Tokens^2) / 2
 * (This is the inverse - calculates USDP received for selling tokens)
 * 
 * Price after trade:
 * New Price = Current Price + (Tokens * price_step) for BUY
 * New Price = Current Price - (Tokens * price_step) for SELL
 */

export interface TradingParams {
  currentPrice: number;
  priceStep: number;
  currentSupply: number;
  totalUsdp: number;
}

export interface BuyResult {
  tokensReceived: number;
  newPrice: number;
  newSupply: number;
  newTotalUsdp: number;
  avgPricePaid: number;
  startPrice: number;
  endPrice: number;
}

export interface SellResult {
  usdpReceived: number;
  newPrice: number;
  newSupply: number;
  newTotalUsdp: number;
  avgPricePaid: number;
  startPrice: number;
  endPrice: number;
}

/**
 * Calculate how many PV tokens a user receives for a given USDP amount
 * Formula: Tokens = (-CurrentPrice + SQRT(CurrentPrice^2 + 2 * price_step * USDP)) / price_step
 */
export function calculateTokensForUsdp(
  usdpAmount: number,
  currentPrice: number,
  priceStep: number
): number {
  if (usdpAmount <= 0) return 0;
  if (priceStep <= 0) {
    throw new Error("Price step must be positive");
  }

  // Formula: Tokens = (-CurrentPrice + SQRT(CurrentPrice^2 + 2 * price_step * USDP)) / price_step
  const discriminant = currentPrice * currentPrice + 2 * priceStep * usdpAmount;
  
  if (discriminant < 0) {
    throw new Error("Invalid calculation - discriminant is negative");
  }

  const tokens = (-currentPrice + Math.sqrt(discriminant)) / priceStep;
  
  return Math.max(0, tokens);
}

/**
 * Calculate how much USDP a user receives for selling PV tokens
 * Uses the integral of the price curve
 * USDP = Tokens * CurrentPrice - (price_step * Tokens^2) / 2
 * But we need to account for the price DECREASING as we sell
 * 
 * Actually, for selling we calculate the area under the curve from (supply - tokens) to supply
 * USDP = integral from (supply - tokens) to supply of (basePrice + priceStep * x) dx
 */
export function calculateUsdpForTokens(
  tokensAmount: number,
  currentPrice: number,
  priceStep: number
): number {
  if (tokensAmount <= 0) return 0;
  if (priceStep <= 0) {
    throw new Error("Price step must be positive");
  }

  // The price at the end of the sell (after all tokens are sold)
  const endPrice = currentPrice - (tokensAmount * priceStep);
  
  if (endPrice < 0) {
    throw new Error("Cannot sell more tokens than would drive price below zero");
  }

  // Area under the curve = average price * tokens
  // Average price = (startPrice + endPrice) / 2
  const avgPrice = (currentPrice + endPrice) / 2;
  const usdpReceived = avgPrice * tokensAmount;
  
  return Math.max(0, usdpReceived);
}

/**
 * Process a BUY order
 * @param usdpAmount - Amount of USDP to spend
 * @param params - Current trading state
 * @returns BuyResult with all updated values
 */
export function processBuyOrder(
  usdpAmount: number,
  params: TradingParams
): BuyResult {
  const { currentPrice, priceStep, currentSupply, totalUsdp } = params;

  const tokensReceived = calculateTokensForUsdp(usdpAmount, currentPrice, priceStep);
  const newPrice = currentPrice + (tokensReceived * priceStep);
  const newSupply = currentSupply + tokensReceived;
  const newTotalUsdp = totalUsdp + usdpAmount;
  const avgPricePaid = tokensReceived > 0 ? usdpAmount / tokensReceived : 0;

  return {
    tokensReceived,
    newPrice,
    newSupply,
    newTotalUsdp,
    avgPricePaid,
    startPrice: currentPrice,
    endPrice: newPrice,
  };
}

/**
 * Process a SELL order
 * @param tokensAmount - Amount of PV tokens to sell
 * @param params - Current trading state
 * @returns SellResult with all updated values
 */
export function processSellOrder(
  tokensAmount: number,
  params: TradingParams
): SellResult {
  const { currentPrice, priceStep, currentSupply, totalUsdp } = params;

  // Validate there's enough supply
  if (tokensAmount > currentSupply) {
    throw new Error("Cannot sell more tokens than current supply");
  }

  const usdpReceived = calculateUsdpForTokens(tokensAmount, currentPrice, priceStep);
  const newPrice = currentPrice - (tokensAmount * priceStep);
  const newSupply = currentSupply - tokensAmount;
  const newTotalUsdp = totalUsdp - usdpReceived;
  const avgPricePaid = tokensAmount > 0 ? usdpReceived / tokensAmount : 0;

  // Ensure we don't go negative
  if (newPrice < 0) {
    throw new Error("Trade would result in negative price");
  }
  if (newTotalUsdp < 0) {
    throw new Error("Trade would result in negative USDP pool");
  }

  return {
    usdpReceived,
    newPrice,
    newSupply,
    newTotalUsdp,
    avgPricePaid,
    startPrice: currentPrice,
    endPrice: newPrice,
  };
}

/**
 * Calculate new average cost basis after a purchase
 * @param currentPvAmount - Current PV holdings
 * @param currentCostBasis - Current average cost basis
 * @param newPvAmount - New PV being added
 * @param newCostBasis - Cost basis of new PV (avg price paid)
 * @returns New average cost basis
 */
export function calculateNewCostBasis(
  currentPvAmount: number,
  currentCostBasis: number,
  newPvAmount: number,
  newCostBasis: number
): number {
  const totalPv = currentPvAmount + newPvAmount;
  if (totalPv === 0) return 0;

  const totalCost = currentPvAmount * currentCostBasis + newPvAmount * newCostBasis;
  return totalCost / totalPv;
}
