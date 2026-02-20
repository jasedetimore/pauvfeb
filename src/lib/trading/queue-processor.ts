/**
 * Queue Processor
 * 
 * This module processes pending orders from the queue table.
 * 
 * Process flow (Batch Implementation):
 * 1. Call `process_order_batch` RPC to process multiple orders at once
 * 2. Return results
 */

import { createClient as createAdminClient } from "@supabase/supabase-js";

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

interface ProcessResult {
  success: boolean;
  orderId: string;
  message: string;
  transactionId?: string;
  error?: string;
  data?: any;
}

interface BatchProcessResult {
  processed_count: number;
  success_count: number;
  fail_count: number;
  results: any[];
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
 * Process a batch of pending orders using the `process_order_batch` RPC
 * This is significantly faster than processing one by one as it reduces network round trips
 */
export async function processBatch(batchSize: number = 50): Promise<BatchProcessResult> {
  const supabase = createProcessorClient();

  try {
    const { data, error } = await supabase.rpc("process_order_batch", {
      p_batch_size: batchSize
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as BatchProcessResult;
  } catch (error) {
    console.error("Batch processing failed:", error);
    throw error;
  }
}

/**
 * Process all pending orders in the queue by calling batch processor repeatedly
 */
export async function processAllPendingOrders(): Promise<BatchProcessResult> {
  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFail = 0;
  let allResults: any[] = [];

  // Keep processing batches until no more orders are processed
  while (true) {
    const result = await processBatch(50);

    if (result.processed_count === 0) {
      break;
    }

    totalProcessed += result.processed_count;
    totalSuccess += result.success_count;
    totalFail += result.fail_count;
    allResults = [...allResults, ...result.results];

    // Add a small delay to prevent hammering if we have millions of orders
    // but typically we want to drain as fast as possible
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return {
    processed_count: totalProcessed,
    success_count: totalSuccess,
    fail_count: totalFail,
    results: allResults
  };
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

// Deprecated single order functions kept for compatibility if needed, 
// but redirected to batch processor with size 1
export async function processNextOrder(): Promise<ProcessResult | null> {
  const result = await processBatch(1);
  if (result.processed_count === 0) return null;

  const firstResult = result.results[0];
  return {
    success: firstResult.success,
    orderId: firstResult.id || "unknown",
    message: firstResult.success ? "Processed via batch" : "Failed via batch",
    error: firstResult.error,
    data: firstResult
  };
}

export async function processOrder(order: QueueOrder): Promise<ProcessResult> {
  // This function is tricky to keep compatible because the batch processor
  // finds its own orders. We can't easily force it to process *this specific* order 
  // without changing the RPC.
  // For now, we'll throw an error to encourage migration.
  throw new Error("processOrder is deprecated. Use processBatch instead.");
}
