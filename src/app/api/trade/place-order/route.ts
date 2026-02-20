import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        // 1. Authenticate User
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Validate Body
        const body = await request.json();
        const { ticker, order_type, amount } = body;

        if (!ticker || !order_type || !amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        if (!["buy", "sell"].includes(order_type)) {
            return NextResponse.json({ error: "Invalid order type" }, { status: 400 });
        }

        // 3. Prepare Queue Payload
        // Note: The UI sends "amount" which maps to either usdp or pv based on order type
        const queuePayload = {
            user_id: user.id,
            ticker: ticker.toUpperCase(),
            order_type: order_type,
            amount_usdp: order_type === "buy" ? amount : 0,
            amount_pv: order_type === "sell" ? amount : 0,
            status: "pending",
        };

        // 4. Insert into Queue (Using Service Role to bypass RLS)
        // We need a Service Role client because we disabled INSERT for authenticated users.
        // However, `createClient` from `@/lib/supabase/server` usually returns the user's client (cookie-based).
        // We need to instantiate a Service Role client here specifically for this write operation.

        // WARNING: 'createClient' in 'src/lib/supabase/server.ts' is likely context-aware. 
        // We need to construct a new admin client manually or extend server.ts.
        // Let's check 'src/lib/supabase/server.ts' content first to be sure.
        // For now, I'll inline the creation of the admin client to ensure it works.

        const adminClient = await createAdminClient();

        const { data, error } = await adminClient
            .from("queue")
            .insert(queuePayload)
            .select()
            .single();

        if (error) {
            console.error("Queue Insert Error:", error);
            return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
        }

        return NextResponse.json({ success: true, order: data });

    } catch (err) {
        console.error("Trade API Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Helper to create Admin Client
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
