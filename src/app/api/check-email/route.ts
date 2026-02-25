import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Call the securely defined RPC to check auth.users
        const { data: exists, error } = await adminClient.rpc("check_email_exists", {
            lookup_email: email,
        });

        if (error) {
            console.error("RPC Error checking email:", error);
            return NextResponse.json({ error: "Database error checking email", details: error.message }, { status: 500 });
        }

        return NextResponse.json({ exists: !!exists });
    } catch (error) {
        console.error("Error checking email:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
