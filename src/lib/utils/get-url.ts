/**
 * Environment-aware base URL resolver.
 *
 * Priority:
 *  1. NEXT_PUBLIC_SITE_URL  — set explicitly (e.g. https://pauv.com in prod)
 *  2. NEXT_PUBLIC_VERCEL_URL — auto-set by Vercel / Amplify
 *  3. NEXT_PUBLIC_APP_URL   — legacy env var already used in this project
 *  4. localhost fallback
 *
 * Always returns a URL with a protocol and trailing slash.
 */
export function getURL(): string {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000/";

  // Ensure protocol
  url = url.includes("http") ? url : `https://${url}`;
  // Ensure trailing slash
  url = url.endsWith("/") ? url : `${url}/`;

  return url;
}
