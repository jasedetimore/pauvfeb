import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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
        const { username, full_name, website, avatar_url } = body;

        // Validate username if provided
        if (username && (username.length < 3 || username.length > 20)) {
            return NextResponse.json({ error: "Username must be between 3 and 20 characters" }, { status: 400 });
        }

        // 3. Prepare Update Payload
        // CRITICAL: Explicitly whitelist fields. DO NOT allow 'usdp_balance' or 'user_id' to be passed.
        const updates: any = {
            updated_at: new Date().toISOString(),
        };

        if (username !== undefined) updates.username = username;
        // Add other profile fields as needed. 
        // Checking schema, 'users' table has: username, usdp_balance.
        // DOES IT HAVE full_name, website, avatar_url?
        // Let's check the schema again. 
        // The previous view_file of 20260204213000_create_users_table.sql showed:
        // id, user_id, username, usdp_balance.
        // It DOES NOT seem to have full_name etc. unless added in another migration.
        // I should only update valid columns.

        // For now, I will only support updating 'username' based on the known schema.
        // If there are other columns, I should check the schema first.
        // I will stick to 'username' for now as that is what is visible in the create statement.

        // 4. Update User Profile (Using Service Role or User Role?)
        // Since we blocked UPDATE for authenticated users in Phase 1, we MUST use Service Role here too.

        const adminClient = createAdminClient();

        const { error } = await adminClient
            .from("users")
            .update(updates)
            .eq("user_id", user.id);

        if (error) {
            console.error("Profile update error:", error);
            // specific check for unique username violation
            if (error.code === '23505') {
                return NextResponse.json({ error: "Username already taken" }, { status: 409 });
            }
            return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error("Profile API Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

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
