import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

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

const cookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = getPublicOrigin(request);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";

  // Build the redirect response up-front so we can attach Set-Cookie headers
  const redirectUrl = code
    ? `${origin}${safeNext}`
    : `${origin}/login?error=auth_callback_error`;
  const response = NextResponse.redirect(redirectUrl);

  if (code) {
    // Create a Supabase client that reads cookies from the request
    // and writes cookies onto both the request AND the response.
    // This ensures exchangeCodeForSession's Set-Cookie headers
    // are actually sent to the browser on the redirect.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, {
                ...options,
                ...cookieOptions,
              })
            );
          },
        },
      }
    );

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

      return response;
    }

    // Code exchange failed — redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  // No code present — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
