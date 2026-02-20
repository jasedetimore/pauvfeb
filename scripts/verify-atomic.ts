
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load env vars
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log("🔍 Verifying Atomic Functions...");

    // 1. Get a test user (any user)
    const { data: users, error: userError } = await supabase
        .from("users")
        .select("user_id, usdp_balance")
        .limit(1);

    if (userError || !users || users.length === 0) {
        console.error("❌ Failed to fetch test user:", userError);
        return;
    }

    const testUser = users[0];
    console.log(`👤 Test User: ${testUser.user_id}, Balance: ${testUser.usdp_balance}`);

    // 2. Test Atomic Increment (Credit)
    console.log("\n🧪 Testing increment_user_balance (Credit $10)...");
    const { data: newBalance, error: creditError } = await supabase.rpc(
        "increment_user_balance",
        {
            p_user_id: testUser.user_id,
            p_amount: 10
        }
    );

    if (creditError) {
        console.error("❌ Credit failed:", creditError);
    } else {
        console.log(`✅ Credit successful. New Balance: ${newBalance}`);
    }

    // 3. Test Atomic Increment (Debit - fail if insufficient)
    // Try to debit 1 QUADRILLION
    console.log("\n🧪 Testing increment_user_balance (Debit 1 Quadrillion to trigger overdraw)...");
    const { data: debitBalance, error: debitError } = await supabase.rpc(
        "increment_user_balance",
        {
            p_user_id: testUser.user_id,
            p_amount: -1000000000000000
        }
    );

    if (debitError) {
        console.log(`✅ Debit blocked as expected: ${debitError.message}`);
    } else {
        console.error(`❌ Debit succeeded unexpectedly! New Balance: ${debitBalance}`);
    }

    // 4. Test Buy Execution (dry run - expecting failure due to non-existent queue/ticker maybe?)
    // We need a valid ticker.
    const { data: issuer } = await supabase.from("issuer_trading").select("ticker").limit(1).single();

    if (issuer) {
        console.log(`\n🧪 Testing execute_buy_order for ticker ${issuer.ticker}...`);
        // We pass a fake queue_id
        const queueId = "00000000-0000-0000-0000-000000000000";

        // Try to buy with $1. If balance is sufficient from step 2, it might work?
        // But we need a REAL queue_id usually for foreign key? 
        // The transaction table has queue_id but is it a FK?

        // Checking 20260204212000_create_transactions_table.sql...
        // It likely is a FK to queue table.
        // So this will fail FK constraint if queue row doesn't exist.
        // That's fine, it proves the function is running and hitting DB constraints.

        const { data: buyResult, error: buyError } = await supabase.rpc(
            "execute_buy_order",
            {
                p_user_id: testUser.user_id,
                p_ticker: issuer.ticker,
                p_amount_usdp: 1,
                p_queue_id: queueId
            }
        );

        if (buyError) {
            console.log(`ℹ️ Buy result error (expected FK violation?): ${buyError.message}`);
            if (buyError.message.includes("foreign key constraint") || buyError.message.includes("violates foreign key")) {
                console.log("✅ Buy function reached DB interaction phase.");
            }
        } else {
            console.log("✅ Buy result:", buyResult);
        }
    }

    // 5. Test Batch Processing
    console.log("\n🧪 Testing process_order_batch...");
    // We expect 0 processed if queue is empty, but function should run without error
    const { data: batchResult, error: batchError } = await supabase.rpc("process_order_batch", { p_batch_size: 10 });

    if (batchError) {
        console.error("❌ Batch processing failed:", batchError);
    } else {
        console.log("✅ Batch processing successful.");
        console.log(`   Processed: ${batchResult.processed_count}`);
        console.log(`   Success: ${batchResult.success_count}`);
        console.log(`   Failed: ${batchResult.fail_count}`);
    }

    console.log("\n✨ Verification Complete");
}

main();
