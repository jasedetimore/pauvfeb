/**
 * Queue Processor
 * 
 * This module processes pending orders from the queue table.
 * 
 * Process flow:
 * 1. Fetch the next pending order from the queue
 * 2. Mark it as 'processing'
 * 3. Validate user balance (USDP for buy, PV for sell)
 * 4. Calculate tokens/USDP using bonding curve formula
 * 5. Update issuer_trading table
 * 6. Create transaction record
 * 7. Update user's USDP balance
 * 8. Update user's portfolio
 * 9. Mark queue order as 'completed'
 * 
 * All operations are wrapped in error handling to ensure
 * failed orders are properly marked and can be retried/refunded.
 */

import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  processBuyOrder,
  processSellOrder,
  calculateNewCostBasis,
  type TradingParams,
} from "./formulas";

// Types for database records
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

interface IssuerTrading {
  id: string;
  ticker: string;
  current_supply: number;
  base_price: number;
  price_step: number;
  current_price: number;
  total_usdp: number;
}

interface UserRecord {
  id: string;
  user_id: string;
  username: string;
  usdp_balance: number;
}

interface PortfolioRecord {
  id: string;
  user_id: string;
  ticker: string;
  pv_amount: number;
  avg_cost_basis: number;
}

interface ProcessResult {
  success: boolean;
  orderId: string;
  message: string;
  transactionId?: string;
  error?: string;
}

/**
 * Create a Supabase admin client for queue processing
 * Uses service_role key to bypass RLS
 */
function createProcessorClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables for queue processor");
  }

  return createAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Fetch the next pending order from the queue
 * Orders are processed in FIFO order (oldest first)
 */
async function fetchNextPendingOrder(supabase: ReturnType<typeof createProcessorClient>): Promise<QueueOrder | null> {
  const { data, error } = await supabase
    .from("queue")
    .select("*")
    .eq("status", "pending")
    .order("date", { ascending: true })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows found
      return null;
    }
    throw new Error(`Failed to fetch pending order: ${error.message}`);
  }

  return data as QueueOrder;
}

/**
 * Update queue order status
 */
async function updateQueueStatus(
  supabase: ReturnType<typeof createProcessorClient>,
  orderId: string,
  status: QueueOrder["status"]
): Promise<void> {
  const { error } = await supabase
    .from("queue")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) {
    throw new Error(`Failed to update queue status: ${error.message}`);
  }
}

/**
 * Fetch issuer trading data
 */
async function fetchIssuerTrading(
  supabase: ReturnType<typeof createProcessorClient>,
  ticker: string
): Promise<IssuerTrading> {
  const { data, error } = await supabase
    .from("issuer_trading")
    .select("*")
    .eq("ticker", ticker)
    .single();

  if (error) {
    throw new Error(`Failed to fetch issuer trading data: ${error.message}`);
  }

  return data as IssuerTrading;
}

/**
 * Fetch user record (for USDP balance)
 */
async function fetchUserRecord(
  supabase: ReturnType<typeof createProcessorClient>,
  userId: string
): Promise<UserRecord> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch user record: ${error.message}`);
  }

  return data as UserRecord;
}

/**
 * Fetch portfolio record (for PV balance)
 * Returns null if user doesn't have a position in this ticker
 */
async function fetchPortfolioRecord(
  supabase: ReturnType<typeof createProcessorClient>,
  userId: string,
  ticker: string
): Promise<PortfolioRecord | null> {
  const { data, error } = await supabase
    .from("portfolio")
    .select("*")
    .eq("user_id", userId)
    .eq("ticker", ticker)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows found - user has no position
      return null;
    }
    throw new Error(`Failed to fetch portfolio record: ${error.message}`);
  }

  return data as PortfolioRecord;
}

/**
 * Update issuer trading data
 */
async function updateIssuerTrading(
  supabase: ReturnType<typeof createProcessorClient>,
  ticker: string,
  newSupply: number,
  newPrice: number,
  newTotalUsdp: number
): Promise<void> {
  const { error } = await supabase
    .from("issuer_trading")
    .update({
      current_supply: newSupply,
      current_price: newPrice,
      total_usdp: newTotalUsdp,
      updated_at: new Date().toISOString(),
    })
    .eq("ticker", ticker);

  if (error) {
    throw new Error(`Failed to update issuer trading: ${error.message}`);
  }
}

/**
 * Create transaction record
 */
async function createTransaction(
  supabase: ReturnType<typeof createProcessorClient>,
  order: QueueOrder,
  usdpAmount: number,
  pvTraded: number,
  avgPricePaid: number,
  startPrice: number,
  endPrice: number
): Promise<string> {
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

  if (error) {
    throw new Error(`Failed to create transaction: ${error.message}`);
  }

  return data.id;
}

/**
 * Update user's USDP balance
 */
async function updateUserBalance(
  supabase: ReturnType<typeof createProcessorClient>,
  userId: string,
  newBalance: number
): Promise<void> {
  if (newBalance < 0) {
    throw new Error("Cannot set negative USDP balance");
  }

  const { error } = await supabase
    .from("users")
    .update({
      usdp_balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update user balance: ${error.message}`);
  }
}

/**
 * Update or create portfolio record
 */
async function upsertPortfolio(
  supabase: ReturnType<typeof createProcessorClient>,
  userId: string,
  ticker: string,
  pvAmount: number,
  avgCostBasis: number
): Promise<void> {
  if (pvAmount < 0) {
    throw new Error("Cannot set negative PV amount");
  }

  // Use upsert with onConflict
  const { error } = await supabase
    .from("portfolio")
    .upsert(
      {
        user_id: userId,
        ticker: ticker,
        pv_amount: pvAmount,
        avg_cost_basis: avgCostBasis,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,ticker",
      }
    );

  if (error) {
    throw new Error(`Failed to update portfolio: ${error.message}`);
  }
}

/**
 * Process a BUY order
 */
async function processBuy(
  supabase: ReturnType<typeof createProcessorClient>,
  order: QueueOrder
): Promise<ProcessResult> {
  // 1. Fetch user record to check USDP balance
  const userRecord = await fetchUserRecord(supabase, order.user_id);

  // 2. Validate user has enough USDP
  if (userRecord.usdp_balance < order.amount_usdp) {
    return {
      success: false,
      orderId: order.id,
      message: "Insufficient USDP balance",
      error: `User has ${userRecord.usdp_balance} USDP but order requires ${order.amount_usdp} USDP`,
    };
  }

  // 3. Fetch issuer trading data
  const issuerTrading = await fetchIssuerTrading(supabase, order.ticker);

  // 4. Calculate tokens using bonding curve formula
  const tradingParams: TradingParams = {
    currentPrice: Number(issuerTrading.current_price),
    priceStep: Number(issuerTrading.price_step),
    currentSupply: Number(issuerTrading.current_supply),
    totalUsdp: Number(issuerTrading.total_usdp),
  };

  const buyResult = processBuyOrder(Number(order.amount_usdp), tradingParams);

  // 5. Fetch current portfolio (may not exist)
  const portfolio = await fetchPortfolioRecord(supabase, order.user_id, order.ticker);

  // 6. Calculate new portfolio values
  const currentPvAmount = portfolio ? Number(portfolio.pv_amount) : 0;
  const currentCostBasis = portfolio ? Number(portfolio.avg_cost_basis) : 0;
  const newPvAmount = currentPvAmount + buyResult.tokensReceived;
  const newCostBasis = calculateNewCostBasis(
    currentPvAmount,
    currentCostBasis,
    buyResult.tokensReceived,
    buyResult.avgPricePaid
  );

  // 7. Update issuer trading
  await updateIssuerTrading(
    supabase,
    order.ticker,
    buyResult.newSupply,
    buyResult.newPrice,
    buyResult.newTotalUsdp
  );

  // 8. Create transaction record
  const transactionId = await createTransaction(
    supabase,
    order,
    Number(order.amount_usdp),
    buyResult.tokensReceived,
    buyResult.avgPricePaid,
    buyResult.startPrice,
    buyResult.endPrice
  );

  // 9. Update user's USDP balance (subtract spent amount)
  const newUsdpBalance = Number(userRecord.usdp_balance) - Number(order.amount_usdp);
  await updateUserBalance(supabase, order.user_id, newUsdpBalance);

  // 10. Update user's portfolio
  await upsertPortfolio(supabase, order.user_id, order.ticker, newPvAmount, newCostBasis);

  return {
    success: true,
    orderId: order.id,
    message: `Successfully bought ${buyResult.tokensReceived.toFixed(6)} PV for ${order.amount_usdp} USDP`,
    transactionId,
  };
}

/**
 * Process a SELL order
 */
async function processSell(
  supabase: ReturnType<typeof createProcessorClient>,
  order: QueueOrder
): Promise<ProcessResult> {
  // 1. Fetch portfolio to check PV balance
  const portfolio = await fetchPortfolioRecord(supabase, order.user_id, order.ticker);

  if (!portfolio) {
    return {
      success: false,
      orderId: order.id,
      message: "User has no position in this ticker",
      error: `User does not own any ${order.ticker} PV tokens`,
    };
  }

  // 2. Validate user has enough PV tokens
  if (Number(portfolio.pv_amount) < Number(order.amount_pv)) {
    return {
      success: false,
      orderId: order.id,
      message: "Insufficient PV balance",
      error: `User has ${portfolio.pv_amount} PV but order requires ${order.amount_pv} PV`,
    };
  }

  // 3. Fetch issuer trading data
  const issuerTrading = await fetchIssuerTrading(supabase, order.ticker);

  // 4. Calculate USDP received using bonding curve formula
  const tradingParams: TradingParams = {
    currentPrice: Number(issuerTrading.current_price),
    priceStep: Number(issuerTrading.price_step),
    currentSupply: Number(issuerTrading.current_supply),
    totalUsdp: Number(issuerTrading.total_usdp),
  };

  const sellResult = processSellOrder(Number(order.amount_pv), tradingParams);

  // 5. Fetch user record for balance update
  const userRecord = await fetchUserRecord(supabase, order.user_id);

  // 6. Calculate new portfolio values
  const newPvAmount = Number(portfolio.pv_amount) - Number(order.amount_pv);
  // Keep the same cost basis (doesn't change on sell)
  const newCostBasis = newPvAmount > 0 ? Number(portfolio.avg_cost_basis) : 0;

  // 7. Update issuer trading
  await updateIssuerTrading(
    supabase,
    order.ticker,
    sellResult.newSupply,
    sellResult.newPrice,
    sellResult.newTotalUsdp
  );

  // 8. Create transaction record
  const transactionId = await createTransaction(
    supabase,
    order,
    sellResult.usdpReceived,
    Number(order.amount_pv),
    sellResult.avgPricePaid,
    sellResult.startPrice,
    sellResult.endPrice
  );

  // 9. Update user's USDP balance (add received amount)
  const newUsdpBalance = Number(userRecord.usdp_balance) + sellResult.usdpReceived;
  await updateUserBalance(supabase, order.user_id, newUsdpBalance);

  // 10. Update user's portfolio
  await upsertPortfolio(supabase, order.user_id, order.ticker, newPvAmount, newCostBasis);

  return {
    success: true,
    orderId: order.id,
    message: `Successfully sold ${order.amount_pv} PV for ${sellResult.usdpReceived.toFixed(2)} USDP`,
    transactionId,
  };
}

/**
 * Process a single order from the queue
 */
export async function processOrder(order: QueueOrder): Promise<ProcessResult> {
  const supabase = createProcessorClient();

  try {
    // Mark order as processing
    await updateQueueStatus(supabase, order.id, "processing");

    // Process based on order type
    let result: ProcessResult;
    if (order.order_type === "buy") {
      result = await processBuy(supabase, order);
    } else {
      result = await processSell(supabase, order);
    }

    // Update queue status based on result
    if (result.success) {
      await updateQueueStatus(supabase, order.id, "completed");
    } else {
      await updateQueueStatus(supabase, order.id, "failed");
    }

    return result;
  } catch (error) {
    // Mark order as failed
    try {
      await updateQueueStatus(supabase, order.id, "failed");
    } catch {
      console.error("Failed to update queue status to failed");
    }

    return {
      success: false,
      orderId: order.id,
      message: "Order processing failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process the next pending order in the queue
 * Returns null if no pending orders exist
 */
export async function processNextOrder(): Promise<ProcessResult | null> {
  const supabase = createProcessorClient();

  const order = await fetchNextPendingOrder(supabase);
  if (!order) {
    return null;
  }

  return processOrder(order);
}

/**
 * Process all pending orders in the queue
 * Processes orders one at a time in FIFO order
 * Returns array of results
 */
export async function processAllPendingOrders(): Promise<ProcessResult[]> {
  const results: ProcessResult[] = [];

  let result = await processNextOrder();
  while (result !== null) {
    results.push(result);
    result = await processNextOrder();
  }

  return results;
}

/**
 * Get count of pending orders
 */
export async function getPendingOrderCount(): Promise<number> {
  const supabase = createProcessorClient();

  const { count, error } = await supabase
    .from("queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) {
    throw new Error(`Failed to count pending orders: ${error.message}`);
  }

  return count ?? 0;
}
