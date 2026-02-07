import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { depositId } = await req.json();

        if (!depositId) {
            return NextResponse.json({ error: "Missing depositId" }, { status: 400 });
        }

        // Initialize Supabase Admin Client (Service Role)
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch the deposit to verify it belongs to this user and get amount
        const { data: deposit, error: fetchError } = await supabaseAdmin
            .from("deposits")
            .select("user_id, amount_usdp, status")
            .eq("id", depositId)
            .single();

        if (fetchError || !deposit) {
            return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
        }

        if (deposit.user_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (deposit.status === "completed") {
            return NextResponse.json({ error: "Deposit already completed" }, { status: 400 });
        }

        // Update deposit status
        await supabaseAdmin
            .from("deposits")
            .update({
                status: "completed",
                updated_at: new Date().toISOString(),
            })
            .eq("id", depositId);

        // Fetch current profile balance
        const { data: userRecord } = await supabaseAdmin
            .from("users")
            .select("usdp_balance")
            .eq("user_id", deposit.user_id)
            .single();

        const currentBalance = userRecord?.usdp_balance || 0;
        const newBalance = currentBalance + deposit.amount_usdp;

        // Update user balance
        await supabaseAdmin
            .from("users")
            .update({ usdp_balance: newBalance })
            .eq("user_id", deposit.user_id);

        console.log(`[Complete Deposit] Credited ${deposit.amount_usdp} USDP to user ${user.email}`);

        return NextResponse.json({
            success: true,
            newBalance,
            credited: deposit.amount_usdp,
        });
    } catch (error) {
        console.error("Complete deposit error:", error);
        return NextResponse.json(
            { error: "Failed to complete deposit" },
            { status: 500 }
        );
    }
}
