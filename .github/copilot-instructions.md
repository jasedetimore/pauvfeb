We are bulding a website called Pauv. here is the info on what we will be using:
  Supabase for database backend, hosted on Supabase Cloud
  AWS with Aplify for frontend
  TypeScript using Next.js with Tailwind CSS
Do not hallucinate, if you have questions ask them. AI first, atomic design for the frontend
Here is the github link we'll be using: https://github.com/jasedetimore/pauvfeb.git
Always use colors.ts, NEVER hard code colors for frontend
to push to supabase, use this: npx supabase@latest db push
USDP is the internal stable coin
PV is the term for a token
Always use supabase.auth.getUser() for initial session hydration in the AuthProvider and keep onAuthStateChange callbacks synchronous to prevent stale token deadlocks.