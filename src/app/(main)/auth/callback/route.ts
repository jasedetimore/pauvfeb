import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Derive the public-facing origin from forwarded headers.
 * AWS Amplify (and other reverse proxies) set x-forwarded-host /
 * x-forwarded-proto while the internal request.url uses localhost.
 */
function getPublicOrigin(request: Request): string {
  const url = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    url.host;
  const proto =
    request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = getPublicOrigin(request);
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
            terms_accepted_at: new Date().toISOString(),
          });
        }
      }

      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
