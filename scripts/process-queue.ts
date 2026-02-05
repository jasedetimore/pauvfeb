/**
 * Standalone Queue Processor Script
 * 
 * This script can be run from the command line to process orders from the queue.
 * 
 * Usage:
 *   npx ts-node scripts/process-queue.ts [--all]
 * 
 * Options:
 *   --all    Process all pending orders (default: process one order)
 * 
 * Environment variables required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 * 
 * This script is designed to be run as a cron job or manually.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local
config({ path: ".env.local" });

// Types
interface QueueOrder {
  id: string;
  user_id: string;
  amount_usdp: number;
  amount_pv: number;
  ticker: string;
  order_type: "buy" | "sell";
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  date: string;
}

interface TradingParams {
  currentPrice: number;
  priceStep: number;
  currentSupply: number;
  totalUsdp: number;
}

interface BuyResult {
  tokensReceived: number;
  newPrice: number;
  newSupply: number;
  newTotalUsdp: number;
  avgPricePaid: number;
  startPrice: number;
  endPrice: number;
}

interface SellResult {
  usdpReceived: number;
  newPrice: number;
  newSupply: number;
  newTotalUsdp: number;
  avgPricePaid: number;
  startPrice: number;
  endPrice: number;
}

interface ProcessResult {
  success: boolean;
  orderId: string;
  message: string;
  transactionId?: string;
  error?: string;
}

// ============================================
// TRADING FORMULAS
// ============================================

/**
 * Calculate tokens for USDP using bonding curve formula
 * Formula: Tokens = (-CurrentPrice + SQRT(CurrentPrice^2 + 2 * price_step * USDP)) / price_step
 */
function calculateTokensForUsdp(
  usdpAmount: number,
  currentPrice: number,
  priceStep: number
): number {
  if (usdpAmount <= 0) return 0;
  if (priceStep <= 0) throw new Error("Price step must be positive");

  const discriminant = currentPrice * currentPrice + 2 * priceStep * usdpAmount;
  if (discriminant < 0) throw new Error("Invalid calculation - discriminant is negative");

  return Math.max(0, (-currentPrice + Math.sqrt(discriminant)) / priceStep);
}

/**
 * Calculate USDP received for selling tokens
 */
function calculateUsdpForTokens(
  tokensAmount: number,
  currentPrice: number,
  priceStep: number
): number {
  if (tokensAmount <= 0) return 0;
  if (priceStep <= 0) throw new Error("Price step must be positive");

  const endPrice = currentPrice - (tokensAmount * priceStep);
  if (endPrice < 0) throw new Error("Cannot sell more tokens than would drive price below zero");

  const avgPrice = (currentPrice + endPrice) / 2;
  return Math.max(0, avgPrice * tokensAmount);
}

/**
 * Process a BUY order calculation
 */
function processBuyOrder(usdpAmount: number, params: TradingParams): BuyResult {
  const { currentPrice, priceStep, currentSupply, totalUsdp } = params;
  const tokensReceived = calculateTokensForUsdp(usdpAmount, currentPrice, priceStep);
  const newPrice = currentPrice + (tokensReceived * priceStep);
  
  return {
    tokensReceived,
    newPrice,
    newSupply: currentSupply + tokensReceived,
    newTotalUsdp: totalUsdp + usdpAmount,
    avgPricePaid: tokensReceived > 0 ? usdpAmount / tokensReceived : 0,
    startPrice: currentPrice,
    endPrice: newPrice,
  };
}

/**
 * Process a SELL order calculation
 */
function processSellOrder(tokensAmount: number, params: TradingParams): SellResult {
  const { currentPrice, priceStep, currentSupply, totalUsdp } = params;

  if (tokensAmount > currentSupply) {
    throw new Error("Cannot sell more tokens than current supply");
  }

  const usdpReceived = calculateUsdpForTokens(tokensAmount, currentPrice, priceStep);
  const newPrice = currentPrice - (tokensAmount * priceStep);
  const newTotalUsdp = totalUsdp - usdpReceived;

  if (newPrice < 0) throw new Error("Trade would result in negative price");
  if (newTotalUsdp < 0) throw new Error("Trade would result in negative USDP pool");

  return {
    usdpReceived,
    newPrice,
    newSupply: currentSupply - tokensAmount,
    newTotalUsdp,
    avgPricePaid: tokensAmount > 0 ? usdpReceived / tokensAmount : 0,
    startPrice: currentPrice,
    endPrice: newPrice,
  };
}

/**
 * Calculate new cost basis after purchase
 */
function calculateNewCostBasis(
  currentPvAmount: number,
  currentCostBasis: number,
  newPvAmount: number,
  newCostBasis: number
): number {
  const totalPv = currentPvAmount + newPvAmount;
  if (totalPv === 0) return 0;
  return (currentPvAmount * currentCostBasis + newPvAmount * newCostBasis) / totalPv;
}

// ============================================
// DATABASE OPERATIONS
// ============================================

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function fetchNextPendingOrder(supabase: ReturnType<typeof createSupabaseClient>): Promise<QueueOrder | null> {
  const { data, error } = await supabase
    .from("queue")
    .select("*")
    .eq("status", "pending")
    .order("date", { ascending: true })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch pending order: ${error.message}`);
  }
  return data;
}

async function updateQueueStatus(supabase: ReturnType<typeof createSupabaseClient>, orderId: string, status: string) {
  const { error } = await supabase
    .from("queue")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) throw new Error(`Failed to update queue status: ${error.message}`);
}

async function fetchIssuerTrading(supabase: ReturnType<typeof createSupabaseClient>, ticker: string) {
  const { data, error } = await supabase.from("issuer_trading").select("*").eq("ticker", ticker).single();
  if (error) throw new Error(`Failed to fetch issuer trading: ${error.message}`);
  return data;
}

async function fetchUserRecord(supabase: ReturnType<typeof createSupabaseClient>, userId: string) {
  const { data, error } = await supabase.from("users").select("*").eq("user_id", userId).single();
  if (error) throw new Error(`Failed to fetch user: ${error.message}`);
  return data;
}

async function fetchPortfolioRecord(supabase: ReturnType<typeof createSupabaseClient>, userId: string, ticker: string) {
  const { data, error } = await supabase.from("portfolio").select("*").eq("user_id", userId).eq("ticker", ticker).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch portfolio: ${error.message}`);
  }
  return data;
}

async function updateIssuerTrading(supabase: ReturnType<typeof createSupabaseClient>, ticker: string, newSupply: number, newPrice: number, newTotalUsdp: number) {
  const { error } = await supabase
    .from("issuer_trading")
    .update({ current_supply: newSupply, current_price: newPrice, total_usdp: newTotalUsdp, updated_at: new Date().toISOString() })
    .eq("ticker", ticker);
  if (error) throw new Error(`Failed to update issuer trading: ${error.message}`);
}

async function createTransaction(supabase: ReturnType<typeof createSupabaseClient>, order: QueueOrder, usdpAmount: number, pvTraded: number, avgPricePaid: number, startPrice: number, endPrice: number) {
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: order.user_id,
      amount_usdp: usdpAmount,
      ticker: order.ticker,
      order_type: order.order_type,
      status: "completed",
      avg_price_paid: avgPricePaid,
      pv_traded: pvTraded,
      start_price: startPrice,
      end_price: endPrice,
      date: new Date().toISOString(),
      queue_id: order.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to create transaction: ${error.message}`);
  return data.id;
}

async function updateUserBalance(supabase: ReturnType<typeof createSupabaseClient>, userId: string, newBalance: number) {
  if (newBalance < 0) throw new Error("Cannot set negative USDP balance");
  const { error } = await supabase.from("users").update({ usdp_balance: newBalance, updated_at: new Date().toISOString() }).eq("user_id", userId);
  if (error) throw new Error(`Failed to update user balance: ${error.message}`);
}

async function upsertPortfolio(supabase: ReturnType<typeof createSupabaseClient>, userId: string, ticker: string, pvAmount: number, avgCostBasis: number) {
  if (pvAmount < 0) throw new Error("Cannot set negative PV amount");
  const { error } = await supabase
    .from("portfolio")
    .upsert({ user_id: userId, ticker, pv_amount: pvAmount, avg_cost_basis: avgCostBasis, updated_at: new Date().toISOString() }, { onConflict: "user_id,ticker" });
  if (error) throw new Error(`Failed to update portfolio: ${error.message}`);
}

// ============================================
// ORDER PROCESSING
// ============================================

async function processBuy(supabase: ReturnType<typeof createSupabaseClient>, order: QueueOrder): Promise<ProcessResult> {
  const userRecord = await fetchUserRecord(supabase, order.user_id);

  if (Number(userRecord.usdp_balance) < Number(order.amount_usdp)) {
    return { success: false, orderId: order.id, message: "Insufficient USDP balance", error: `User has ${userRecord.usdp_balance} USDP but order requires ${order.amount_usdp} USDP` };
  }

  const issuerTrading = await fetchIssuerTrading(supabase, order.ticker);
  const tradingParams: TradingParams = {
    currentPrice: Number(issuerTrading.current_price),
    priceStep: Number(issuerTrading.price_step),
    currentSupply: Number(issuerTrading.current_supply),
    totalUsdp: Number(issuerTrading.total_usdp),
  };

  const buyResult = processBuyOrder(Number(order.amount_usdp), tradingParams);
  const portfolio = await fetchPortfolioRecord(supabase, order.user_id, order.ticker);

  const currentPvAmount = portfolio ? Number(portfolio.pv_amount) : 0;
  const currentCostBasis = portfolio ? Number(portfolio.avg_cost_basis) : 0;
  const newPvAmount = currentPvAmount + buyResult.tokensReceived;
  const newCostBasis = calculateNewCostBasis(currentPvAmount, currentCostBasis, buyResult.tokensReceived, buyResult.avgPricePaid);

  await updateIssuerTrading(supabase, order.ticker, buyResult.newSupply, buyResult.newPrice, buyResult.newTotalUsdp);
  const transactionId = await createTransaction(supabase, order, Number(order.amount_usdp), buyResult.tokensReceived, buyResult.avgPricePaid, buyResult.startPrice, buyResult.endPrice);
  await updateUserBalance(supabase, order.user_id, Number(userRecord.usdp_balance) - Number(order.amount_usdp));
  await upsertPortfolio(supabase, order.user_id, order.ticker, newPvAmount, newCostBasis);

  return { success: true, orderId: order.id, message: `Bought ${buyResult.tokensReceived.toFixed(6)} PV for ${order.amount_usdp} USDP`, transactionId };
}

async function processSell(supabase: ReturnType<typeof createSupabaseClient>, order: QueueOrder): Promise<ProcessResult> {
  const portfolio = await fetchPortfolioRecord(supabase, order.user_id, order.ticker);

  if (!portfolio) {
    return { success: false, orderId: order.id, message: "No position in ticker", error: `User does not own any ${order.ticker} PV tokens` };
  }

  if (Number(portfolio.pv_amount) < Number(order.amount_pv)) {
    return { success: false, orderId: order.id, message: "Insufficient PV balance", error: `User has ${portfolio.pv_amount} PV but order requires ${order.amount_pv} PV` };
  }

  const issuerTrading = await fetchIssuerTrading(supabase, order.ticker);
  const tradingParams: TradingParams = {
    currentPrice: Number(issuerTrading.current_price),
    priceStep: Number(issuerTrading.price_step),
    currentSupply: Number(issuerTrading.current_supply),
    totalUsdp: Number(issuerTrading.total_usdp),
  };

  const sellResult = processSellOrder(Number(order.amount_pv), tradingParams);
  const userRecord = await fetchUserRecord(supabase, order.user_id);

  const newPvAmount = Number(portfolio.pv_amount) - Number(order.amount_pv);
  const newCostBasis = newPvAmount > 0 ? Number(portfolio.avg_cost_basis) : 0;

  await updateIssuerTrading(supabase, order.ticker, sellResult.newSupply, sellResult.newPrice, sellResult.newTotalUsdp);
  const transactionId = await createTransaction(supabase, order, sellResult.usdpReceived, Number(order.amount_pv), sellResult.avgPricePaid, sellResult.startPrice, sellResult.endPrice);
  await updateUserBalance(supabase, order.user_id, Number(userRecord.usdp_balance) + sellResult.usdpReceived);
  await upsertPortfolio(supabase, order.user_id, order.ticker, newPvAmount, newCostBasis);

  return { success: true, orderId: order.id, message: `Sold ${order.amount_pv} PV for ${sellResult.usdpReceived.toFixed(2)} USDP`, transactionId };
}

async function processOrder(supabase: ReturnType<typeof createSupabaseClient>, order: QueueOrder): Promise<ProcessResult> {
  try {
    await updateQueueStatus(supabase, order.id, "processing");
    const result = order.order_type === "buy" ? await processBuy(supabase, order) : await processSell(supabase, order);
    await updateQueueStatus(supabase, order.id, result.success ? "completed" : "failed");
    return result;
  } catch (error) {
    try { await updateQueueStatus(supabase, order.id, "failed"); } catch { /* ignore */ }
    return { success: false, orderId: order.id, message: "Order processing failed", error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const processAll = args.includes("--all");
  const continuous = args.includes("--continuous") || args.includes("-c");
  const intervalMs = 1000; // Check every 1 second in continuous mode

  console.log("================================================");
  console.log("  PAUV Queue Processor");
  console.log("  Started:", new Date().toISOString());
  console.log("  Mode:", continuous ? "CONTINUOUS (Ctrl+C to stop)" : processAll ? "Process ALL pending orders" : "Process ONE order");
  console.log("================================================\n");

  const supabase = createSupabaseClient();
  const results: ProcessResult[] = [];

  if (continuous) {
    // Continuous mode - keep processing forever
    console.log("Running in continuous mode. Processing all pending orders...\n");
    
    const runLoop = async () => {
      while (true) {
        let order = await fetchNextPendingOrder(supabase);
        
        while (order) {
          console.log(`Processing order: ${order.id} (${order.order_type} ${order.ticker})`);
          const result = await processOrder(supabase, order);
          results.push(result);
          console.log(`  Result: ${result.success ? "✓" : "✗"} ${result.message}`);
          if (result.error) console.log(`  Error: ${result.error}`);
          console.log("");
          
          // Get next order (failed orders are marked as 'failed', so they won't be picked up again)
          order = await fetchNextPendingOrder(supabase);
        }
        
        // No pending orders, wait before checking again
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    };
    
    // Handle graceful shutdown
    process.on("SIGINT", () => {
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      console.log("\n================================================");
      console.log("  Shutting down...");
      console.log("  Total processed:", results.length);
      console.log("  Successful:", successful);
      console.log("  Failed:", failed);
      console.log("  Stopped:", new Date().toISOString());
      console.log("================================================");
      process.exit(0);
    });
    
    await runLoop();
  } else if (processAll) {
    // Process all currently pending orders
    let order = await fetchNextPendingOrder(supabase);
    while (order) {
      console.log(`Processing order: ${order.id} (${order.order_type} ${order.ticker})`);
      const result = await processOrder(supabase, order);
      results.push(result);
      console.log(`  Result: ${result.success ? "✓" : "✗"} ${result.message}`);
      if (result.error) console.log(`  Error: ${result.error}`);
      console.log("");
      order = await fetchNextPendingOrder(supabase);
    }
  } else {
    const order = await fetchNextPendingOrder(supabase);
    if (order) {
      console.log(`Processing order: ${order.id} (${order.order_type} ${order.ticker})`);
      const result = await processOrder(supabase, order);
      results.push(result);
      console.log(`  Result: ${result.success ? "✓" : "✗"} ${result.message}`);
      if (result.error) console.log(`  Error: ${result.error}`);
      console.log("");
    } else {
      console.log("No pending orders found.\n");
    }
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log("================================================");
  console.log("  Summary");
  console.log("  Total processed:", results.length);
  console.log("  Successful:", successful);
  console.log("  Failed:", failed);
  console.log("  Completed:", new Date().toISOString());
  console.log("================================================");

  process.exit(0); // Always exit 0 - failed orders are logged, not fatal
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
