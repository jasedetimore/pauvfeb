/**
 * Trading Module
 * 
 * Exports trading utilities and queue processing functions
 */

export {
  calculateTokensForUsdp,
  calculateUsdpForTokens,
  processBuyOrder,
  processSellOrder,
  calculateNewCostBasis,
  type TradingParams,
  type BuyResult,
  type SellResult,
} from "./formulas";

export {
  processOrder,
  processNextOrder,
  processAllPendingOrders,
  getPendingOrderCount,
} from "./queue-processor";
