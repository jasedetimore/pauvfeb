import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Ensure user record exists in the users table (for OAuth sign-ups)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if user record already exists
        const { data: existingUser } = await supabase
          .from("users")
          .select("user_id")
          .eq("user_id", user.id)
          .single();

        if (!existingUser) {
          // Create user record for new OAuth users
          const username =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "user";

          await supabase.from("users").insert({
            user_id: user.id,
            username,
            usdp_balance: 1000, // Give new users 1000 USDP to start
          });
        }
      }

      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
