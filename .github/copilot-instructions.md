We are bulding a website called Pauv. here is the info on what we will be using:
  Supabase for database backend, hosted on Supabase Cloud
  AWS with Aplify for frontend
  TypeScript using Next.js with Tailwind CSS
  Cloudflare zero trust for admin.pauv.com
Do not hallucinate, if you have questions ask them. AI first, atomic design for the frontend
Here is the github link we'll be using: https://github.com/jasedetimore/pauvfeb.git
Always use colors.ts, NEVER hard code colors for frontend
to push to supabase, use this: npx supabase@latest db push
USDP is the internal stable coin
PV is the term for a token
Always use supabase.auth.getUser() for initial session hydration in the AuthProvider and keep onAuthStateChange callbacks synchronous to prevent stale token deadlocks.
Admin is hosted at admin.pauv.com behind Cloudflare Zero Trust (only @pauv.com emails). Do NOT use Supabase auth for admin pages — CF injects Cf-Access-Authenticated-User-Email header. Use verifyAdmin(request) in API routes, NOT verifyAdminFromJWT. pauv.com/admin redirects to admin.pauv.com.
Always use supabase.auth.getUser() for initial session hydration in the AuthProvider and keep onAuthStateChange callbacks synchronous to prevent stale token deadlocks.