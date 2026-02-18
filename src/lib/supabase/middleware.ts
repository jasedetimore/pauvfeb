import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Shared cookie options - must match client.ts and server.ts
const cookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

/**
 * Admin subdomain host pattern.
 * In production: admin.pauv.com
 * In development: admin.localhost:3000 (or override with ADMIN_HOST env)
 */
const ADMIN_HOST =
  process.env.ADMIN_HOST ||
  (process.env.NODE_ENV === "production" ? "admin.pauv.com" : "admin.localhost:3000");

const MAIN_SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://pauv.com";

function isAdminSubdomain(request: NextRequest): boolean {
  const host = request.headers.get("host") || "";
  return host === ADMIN_HOST || host.startsWith("admin.");
}

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

  // ─── PKCE code rescue ───
  // If Supabase redirected the OAuth code to a URL other than /auth/callback
  // (e.g. the site-url fallback https://pauv.com/?code=...), forward it to
  // the callback route so the code gets exchanged for a session.
  const pathname = request.nextUrl.pathname;
  const code = request.nextUrl.searchParams.get("code");
  if (
    code &&
    !pathname.startsWith("/auth/callback") &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next")
  ) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    // Preserve the code param; add next= so callback knows where to land
    callbackUrl.searchParams.set("code", code);
    if (!callbackUrl.searchParams.has("next")) {
      callbackUrl.searchParams.set("next", pathname === "/" ? "/" : pathname);
    }
    return NextResponse.redirect(callbackUrl);
  }

  // IMPORTANT: Call getUser() FIRST before any route matching.
  // This refreshes the session cookie if needed.
  // Do NOT add any logic between createServerClient and getUser().
  const { data: { user }, error } = await supabase.auth.getUser();

  // ─── Admin Subdomain Handling (admin.pauv.com) ───
  // Cloudflare Zero Trust gates access — only @pauv.com emails get through.
  // We verify the CF header here as defense-in-depth.
  if (isAdminSubdomain(request)) {
    const cfEmail = request.headers.get("cf-access-authenticated-user-email");

    // In production, CF headers must be present
    if (process.env.NODE_ENV === "production" && (!cfEmail || !cfEmail.endsWith("@pauv.com"))) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Rewrite root to /admin so admin.pauv.com/ shows the admin dashboard
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.rewrite(url);
    }

    // Allow /admin/* and /api/admin/* paths on the admin subdomain
    // Block non-admin paths (don't serve the main site on admin subdomain)
    if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin") && !pathname.startsWith("/_next") && !pathname.startsWith("/api/")) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return supabaseResponse;
  }

  // ─── Main Domain: Redirect /admin to admin subdomain ───
  if (pathname.startsWith("/admin")) {
    const adminUrl = process.env.NODE_ENV === "production"
      ? `https://${ADMIN_HOST}${pathname}`
      : `http://${ADMIN_HOST}${pathname}`;
    return NextResponse.redirect(adminUrl);
  }
  
  // Log for debugging (can be removed in production)
  if (process.env.NODE_ENV === "development") {
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
