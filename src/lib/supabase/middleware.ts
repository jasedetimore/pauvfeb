import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Shared cookie options - must match client.ts and server.ts
const cookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              ...cookieOptions,
            })
          );
        },
      },
    }
  );

  // IMPORTANT: Call getUser() FIRST before any route matching.
  // This refreshes the session cookie if needed.
  // Do NOT add any logic between createServerClient and getUser().
  const { data: { user }, error } = await supabase.auth.getUser();

  // Protect /admin routes - must be logged in AND be an admin
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Not logged in - redirect to login
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    
    // Logged in but not an admin - redirect to home
    const isAdmin = user.app_metadata?.admin === true;
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }
  
  // Log for debugging (can be removed in production)
  if (process.env.NODE_ENV === "development") {
    const pathname = request.nextUrl.pathname;
    if (!pathname.startsWith("/_next") && !pathname.startsWith("/api")) {
      // Only log strictly if it's NOT the "Auth session missing!" error which just means "not logged in"
      const isAuthMissing = error?.message === "Auth session missing!";
      if (!isAuthMissing) {
        console.log(`[Middleware] ${pathname}: user=${user?.email || "none"}, admin=${user?.app_metadata?.admin || false}`);
        if (error) console.error(`[Middleware Error] ${error.message}`);
      }
    }
  }

  return supabaseResponse;
}
