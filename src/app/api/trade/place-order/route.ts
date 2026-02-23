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

        if (typeof ticker !== 'string' || typeof order_type !== 'string' || typeof amount !== 'number') {
            return NextResponse.json({ error: "Invalid parameter types" }, { status: 400 });
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json({ error: "Amount must be a positive finite number" }, { status: 400 });
        }

        const MAX_ORDER_AMOUNT = 1_000_000;
        const MIN_ORDER_AMOUNT = 0.01;
        if (amount < MIN_ORDER_AMOUNT || amount > MAX_ORDER_AMOUNT) {
            return NextResponse.json(
                { error: `Amount must be between $${MIN_ORDER_AMOUNT} and $${MAX_ORDER_AMOUNT}` },
                { status: 400 }
            );
        }

        if (!/^[A-Z]{2,10}$/i.test(ticker)) {
            return NextResponse.json({ error: "Invalid ticker format" }, { status: 400 });
        }

        if (!["buy", "sell"].includes(order_type)) {
            return NextResponse.json({ error: "Invalid order type" }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // 3. Rate limit: max 5 concurrent pending orders per user
        const { count: pendingCount } = await adminClient
            .from("queue")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "pending");

        if ((pendingCount ?? 0) >= 5) {
            return NextResponse.json(
                { error: "Too many pending orders. Please wait for existing orders to process." },
                { status: 429 }
            );
        }

        // 4. Prepare Queue Payload
        const queuePayload = {
            user_id: user.id,
            ticker: ticker.toUpperCase(),
            order_type: order_type,
            amount_usdp: order_type === "buy" ? amount : 0,
            amount_pv: order_type === "sell" ? amount : 0,
            status: "pending",
        };

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
