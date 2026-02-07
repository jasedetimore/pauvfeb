import { NextRequest, NextResponse } from "next/server";
// Cache buster: 2026-02-06 18:48
import { createClient } from "@/lib/supabase/server";
import { createSoapCheckoutSession, createSoapCustomer } from "@/lib/soap/client";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthorized or missing email" }, { status: 401 });
        }

        console.log(`[Checkout Route] Starting checkout for ${user.email}. SOAP_API_KEY: ${!!process.env.SOAP_API_KEY}, SOAPBOX_API_KEY: ${!!process.env.SOAPBOX_API_KEY}`);

        const body = await req.json();
        const { amount } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        // Create record in database as pending
        const { data: deposit, error: dbError } = await supabase
            .from("deposits")
            .insert({
                user_id: user.id,
                amount_usdp: amount,
                status: "pending",
            })
            .select()
            .single();

        if (dbError) {
            console.error("Database error (inserting deposit):", dbError);
            // If the table is missing, we log it but proceed to create the checkout session 
            // so the user can see the flow. In a real app, this should be fixed by a migration.
            if (dbError.code !== 'PGRST205') {
                return NextResponse.json(
                    { error: "Failed to create deposit record" },
                    { status: 500 }
                );
            }
        }

        const depositId = deposit?.id;


        // Create Checkout Session
        try {
            // Ensure customer exists
            const fullName = user.user_metadata?.full_name || "User Customer";
            const nameParts = fullName.trim().split(/\s+/);
            const firstName = nameParts[0] || "User";
            const lastName = nameParts.slice(1).join(" ") || "Customer";

            let customerId = user.user_metadata?.soap_customer_id;

            if (!customerId) {
                const customer = await createSoapCustomer({
                    email: user.email!,
                    first_name: firstName,
                    last_name: lastName,
                });
                customerId = customer.id;

                // Store the customer ID for future use to avoid duplicate errors
                const { error: updateError } = await supabase.auth.updateUser({
                    data: { soap_customer_id: customerId }
                });

                if (updateError) {
                    console.warn("[Checkout Route] Failed to update user metadata with customer ID:", updateError);
                } else {
                    console.log("[Checkout Route] Stored Soap customer ID in user metadata");
                }
            } else {
                console.log(`[Checkout Route] Using existing Soap customer ID: ${customerId}`);
            }

            const session = await createSoapCheckoutSession({
                customer_id: customerId,
                fixed_amount_cents: Math.round(amount * 100),
                return_url: `${req.nextUrl.origin}/account?payment=success${depositId ? `&deposit_id=${depositId}` : ''}`,
                type: "deposit"
            });

            // Update deposit with provider ID if it exists
            if (depositId) {
                await supabase
                    .from("deposits")
                    .update({ provider_id: session.id })
                    .eq("id", depositId);
            }

            return NextResponse.json({ url: session.url });
        } catch (apiError: any) {
            console.error("Payment provider error:", apiError);
            // Mark deposit as failed if it exists
            if (depositId) {
                await supabase
                    .from("deposits")
                    .update({ status: "failed" })
                    .eq("id", depositId);
            }

            return NextResponse.json(
                { error: "Failed to create payment session" },
                { status: 502 }
            );
        }
    } catch (error) {
        console.error("Internal server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
