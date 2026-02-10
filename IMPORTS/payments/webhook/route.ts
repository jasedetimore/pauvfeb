import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // NOTE: This should probably be the service role client for webhooks
import { createClient as createSupabaseClient } from "@supabase/supabase-js"; // fallback for service role

export async function POST(req: NextRequest) {
    try {
        const payload = await req.text();
        // const signature = req.headers.get("soap-signature"); // Hypothetical header

        // TODO: Verify signature
        // if (!verifyWebhookSignature(payload, signature)) { ... }

        const event = JSON.parse(payload);
        console.log("Received webhook event:", event);

        // Initialize Supabase Admin Client (Service Role)
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        if (event.type === "payment.succeeded") {
            const { depositId } = event.metadata || {};
            const { amount } = event.data;

            if (depositId) {
                // Update deposit status
                await supabaseAdmin
                    .from("deposits")
                    .update({
                        status: "completed",
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", depositId);

                // Fetch the deposit to get user_id if not in metadata, or trust metadata
                const { data: deposit } = await supabaseAdmin
                    .from("deposits")
                    .select("user_id, amount_usdp")
                    .eq("id", depositId)
                    .single();

                if (deposit) {
                    // Credit User Balance
                    // Using an RPC call is safer for atomic increments, 
                    // but for now we'll do read-modify-write if no RPC exists.
                    // Ideally: await supabaseAdmin.rpc('increment_balance', { user_id: deposit.user_id, amount: deposit.amount_usdp });

                    // Fetch current user balance
                    const { data: userRecord } = await supabaseAdmin
                        .from("users")
                        .select("usdp_balance")
                        .eq("user_id", deposit.user_id)
                        .single();

                    const currentBalance = userRecord?.usdp_balance || 0;
                    const newBalance = currentBalance + deposit.amount_usdp;

                    await supabaseAdmin
                        .from("users")
                        .update({ usdp_balance: newBalance })
                        .eq("user_id", deposit.user_id);
                }
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        );
    }
}
