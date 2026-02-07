/**
 * Supabase Edge Function: Process Queue
 * 
 * Event-driven queue processor triggered by database webhook.
 * Wakes up when a new order is inserted, processes ALL pending orders, then sleeps.
 * 
 * Trigger: Database Webhook on INSERT to `queue` table
 * 
 * To deploy:
 *   npx supabase functions deploy process-queue --project-ref YOUR_PROJECT_REF
 * 
 * To set the service role key secret:
 *   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key --project-ref YOUR_PROJECT_REF
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.1"

// CORS headers for HTTP requests
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://pauv.com";
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface ProcessResult {
  processed: boolean
  order_id?: string
  order_type?: string
  tokens_received?: number
  tokens_sold?: number
  usdp_spent?: number
  usdp_received?: number
  transaction_id?: string
  error?: string
  message?: string
}

interface BatchResult {
  total_processed: number
  successful: number
  failed: number
  results: ProcessResult[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  console.log(`[${new Date().toISOString()}] Queue processor triggered`)

  try {
    // Get environment variables (automatically set by Supabase)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Log webhook payload if this was triggered by a database insert
    if (req.method === "POST") {
      try {
        const body = await req.json()
        if (body.type === "INSERT" && body.table === "queue") {
          console.log(`Triggered by new queue item: ${body.record?.id} (${body.record?.order_type} ${body.record?.ticker})`)
        }
      } catch {
        // No body or invalid JSON - manual trigger, continue processing
      }
    }

    // Process ALL pending orders using the database function
    // This ensures we drain the queue completely before going back to sleep
    const { data, error } = await supabase.rpc("process_all_pending_orders")

    if (error) {
      throw new Error(`Failed to process orders: ${error.message}`)
    }

    const result = data as BatchResult
    const duration = Date.now() - startTime

    console.log(`[${new Date().toISOString()}] Completed in ${duration}ms`)
    console.log(`  - Total processed: ${result.total_processed}`)
    console.log(`  - Successful: ${result.successful}`)
    console.log(`  - Failed: ${result.failed}`)

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        duration_ms: duration,
        ...result,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${new Date().toISOString()}] Error after ${duration}ms:`, error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})
