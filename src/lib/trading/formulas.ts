/**
 * Trading Formula Utilities
 *
 * Implements a **linear bonding curve** model for PV (Personal Value) token
 * pricing.  The price of a token increases linearly with the total supply,
 * i.e.  price(supply) = basePrice + priceStep * supply.
 *
 * All calculations use Decimal.js (30-digit precision) to eliminate IEEE 754
 * floating-point rounding errors that would otherwise compound across
 * thousands of trades on a fintech platform.
 *
 * ─── Core formulae ────────────────────────────────────────────────────────
 *
 * BUY  (spending USDP to receive PV tokens):
 *   The cost of buying `n` tokens starting at price `p` with step `s` is the
 *   area under the curve from `supply` to `supply + n`:
 *     Cost = n*p + s*n²/2
 *   Solving for `n` given a fixed USDP budget via the quadratic formula:
 *     n = (-p + √(p² + 2·s·USDP)) / s
 *
 * SELL (returning PV tokens to receive USDP):
 *   The USDP received is the area under the curve from `supply - n` to
 *   `supply`, which equals:
 *     USDP = avgPrice × n   where avgPrice = (startPrice + endPrice) / 2
 *     endPrice = currentPrice - n·priceStep
 *
 * Price after any trade:
 *   BUY:   newPrice = currentPrice + tokensTraded × priceStep
 *   SELL:  newPrice = currentPrice - tokensTraded × priceStep
 * ──────────────────────────────────────────────────────────────────────────
 */

import Decimal from "decimal.js";

// 30 significant digits — far beyond IEEE 754 double (≈15.9 digits)
Decimal.set({ precision: 30 });

/**
 * Snapshot of the current trading state for a single issuer.
 * Passed into processBuyOrder / processSellOrder.
 */
export interface TradingParams {
  /** The current per-token price on the bonding curve (in USDP). */
  currentPrice: number;
  /** How much the price increases/decreases per 1 token of supply change. */
  priceStep: number;
  /** Total PV tokens currently in circulation for this issuer. */
  currentSupply: number;
  /** Total USDP locked in the bonding curve's liquidity pool. */
  totalUsdp: number;
}

/** Result returned after executing a BUY order. */
export interface BuyResult {
  /** Number of PV tokens the buyer receives. */
  tokensReceived: number;
  /** The new per-token price after this trade. */
  newPrice: number;
  /** The new total supply after this trade. */
  newSupply: number;
  /** The new total USDP in the liquidity pool after this trade. */
  newTotalUsdp: number;
  /** The effective average price the buyer paid per token (USDP / tokens). */
  avgPricePaid: number;
  /** The per-token price at the moment the trade started. */
  startPrice: number;
  /** The per-token price at the moment the trade ended (= newPrice). */
  endPrice: number;
}

/** Result returned after executing a SELL order. */
export interface SellResult {
  /** Amount of USDP the seller receives. */
  usdpReceived: number;
  /** The new per-token price after this trade. */
  newPrice: number;
  /** The new total supply after this trade. */
  newSupply: number;
  /** The new total USDP in the liquidity pool after this trade. */
  newTotalUsdp: number;
  /** The effective average price the seller received per token. */
  avgPricePaid: number;
  /** The per-token price at the moment the trade started. */
  startPrice: number;
  /** The per-token price at the moment the trade ended (= newPrice). */
  endPrice: number;
}

/**
 * Calculate how many PV tokens a buyer receives for a given USDP spend.
 *
 * Uses the quadratic formula derived from the linear bonding curve integral:
 *   tokens = (-currentPrice + √(currentPrice² + 2 · priceStep · usdpAmount)) / priceStep
 *
 * @param usdpAmount   - USDP the buyer is spending (must be > 0)
 * @param currentPrice - current per-token price on the curve
 * @param priceStep    - price increment per 1 token of supply (must be > 0)
 * @returns the number of PV tokens the buyer receives
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

  const usdp = new Decimal(usdpAmount);
  const price = new Decimal(currentPrice);
  const step = new Decimal(priceStep);

  // discriminant = price² + 2·step·usdp  (inside the √ of the quadratic formula)
  const discriminant = price.pow(2).plus(step.times(2).times(usdp));

  if (discriminant.isNegative()) {
    throw new Error("Invalid calculation - discriminant is negative");
  }

  // tokens = (√discriminant - price) / step
  const tokens = discriminant.sqrt().minus(price).div(step);

  // Guard against negative tokens from floating-point edge cases
  return Decimal.max(0, tokens).toNumber();
}

/**
 * Calculate how much USDP a seller receives for a given number of PV tokens.
 *
 * The USDP received equals the area under the bonding curve between
 * (currentSupply - tokensAmount) and currentSupply:
 *   endPrice = currentPrice - tokensAmount · priceStep
 *   avgPrice = (currentPrice + endPrice) / 2
 *   usdpReceived = avgPrice × tokensAmount
 *
 * @param tokensAmount - number of PV tokens being sold (must be > 0)
 * @param currentPrice - current per-token price on the curve
 * @param priceStep    - price increment per 1 token of supply (must be > 0)
 * @returns the USDP the seller receives
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

  const tokens = new Decimal(tokensAmount);
  const price = new Decimal(currentPrice);
  const step = new Decimal(priceStep);

  // Price after all tokens are sold (curve moves left)
  const endPrice = price.minus(tokens.times(step));

  if (endPrice.isNegative()) {
    throw new Error("Cannot sell more tokens than would drive price below zero");
  }

  // Trapezoidal area: average of start and end prices × quantity
  const avgPrice = price.plus(endPrice).div(2);
  const usdpReceived = avgPrice.times(tokens);

  return Decimal.max(0, usdpReceived).toNumber();
}

/**
 * Process a complete BUY order: spend USDP → receive PV tokens.
 *
 * 1. Calculates how many tokens the buyer gets for their USDP.
 * 2. Computes the new price, supply, and liquidity pool totals.
 * 3. Returns the full before/after state for recording in a transaction.
 *
 * @param usdpAmount - amount of USDP the buyer is spending
 * @param params     - current trading state for the issuer
 * @returns BuyResult with all updated values
 */
export function processBuyOrder(
  usdpAmount: number,
  params: TradingParams
): BuyResult {
  const { currentPrice, priceStep, currentSupply, totalUsdp } = params;

  // Step 1: determine how many tokens the buyer receives
  const tokensReceived = calculateTokensForUsdp(usdpAmount, currentPrice, priceStep);

  const dTokens = new Decimal(tokensReceived);
  const dStep = new Decimal(priceStep);

  // Step 2: compute new curve state
  // newPrice = currentPrice + tokensReceived × priceStep  (curve moves right)
  const newPrice = new Decimal(currentPrice).plus(dTokens.times(dStep)).toNumber();
  // Supply increases by the tokens minted
  const newSupply = new Decimal(currentSupply).plus(dTokens).toNumber();
  // USDP pool grows by the buyer's spend
  const newTotalUsdp = new Decimal(totalUsdp).plus(usdpAmount).toNumber();
  // Effective average price = total spent / tokens received
  const avgPricePaid = tokensReceived > 0
    ? new Decimal(usdpAmount).div(dTokens).toNumber()
    : 0;

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
 * Process a complete SELL order: return PV tokens → receive USDP.
 *
 * 1. Validates the seller isn't selling more than the total supply.
 * 2. Calculates the USDP payout from the bonding curve integral.
 * 3. Computes the new price, supply, and liquidity pool totals.
 * 4. Validates invariants (no negative price, no negative pool).
 *
 * @param tokensAmount - number of PV tokens being sold
 * @param params       - current trading state for the issuer
 * @returns SellResult with all updated values
 */
export function processSellOrder(
  tokensAmount: number,
  params: TradingParams
): SellResult {
  const { currentPrice, priceStep, currentSupply, totalUsdp } = params;

  // Cannot sell more tokens than exist in circulation
  if (tokensAmount > currentSupply) {
    throw new Error("Cannot sell more tokens than current supply");
  }

  // Step 1: determine USDP payout for the tokens being sold
  const usdpReceived = calculateUsdpForTokens(tokensAmount, currentPrice, priceStep);

  const dTokens = new Decimal(tokensAmount);
  const dStep = new Decimal(priceStep);

  // Step 2: compute new curve state
  // newPrice = currentPrice - tokensAmount × priceStep  (curve moves left)
  const newPrice = new Decimal(currentPrice).minus(dTokens.times(dStep)).toNumber();
  // Supply decreases by the tokens burned
  const newSupply = new Decimal(currentSupply).minus(dTokens).toNumber();
  // USDP pool shrinks by the payout
  const newTotalUsdp = new Decimal(totalUsdp).minus(usdpReceived).toNumber();
  // Effective average price = USDP received / tokens sold
  const avgPricePaid = tokensAmount > 0
    ? new Decimal(usdpReceived).div(dTokens).toNumber()
    : 0;

  // Invariant checks — these should never fail if inputs are valid,
  // but act as a safety net against data corruption.
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
 * Calculate the new weighted-average cost basis after a purchase.
 *
 * When a user buys additional tokens at a different price, their overall
 * cost basis is the weighted average of the old and new positions:
 *   newBasis = (oldQty × oldBasis + newQty × newBasis) / (oldQty + newQty)
 *
 * @param currentPvAmount  - user's existing PV token holdings
 * @param currentCostBasis - user's existing average cost per token
 * @param newPvAmount      - additional PV tokens being added
 * @param newCostBasis     - average price paid for the new tokens
 * @returns the new blended average cost basis per token
 */
export function calculateNewCostBasis(
  currentPvAmount: number,
  currentCostBasis: number,
  newPvAmount: number,
  newCostBasis: number
): number {
  const totalPv = new Decimal(currentPvAmount).plus(newPvAmount);
  if (totalPv.isZero()) return 0;

  // totalCost = (existing tokens × their avg cost) + (new tokens × their avg cost)
  const totalCost = new Decimal(currentPvAmount)
    .times(currentCostBasis)
    .plus(new Decimal(newPvAmount).times(newCostBasis));

  // New blended average = total cost / total quantity
  return totalCost.div(totalPv).toNumber();
}
