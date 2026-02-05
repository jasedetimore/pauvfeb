import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;
let anonClient: ReturnType<typeof createBrowserClient> | null = null;

// Create a shared browser client so auth events stay in sync across the app
// Uses document.cookie automatically (matches server-side cookie handling)
export function createClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      // No options needed - @supabase/ssr uses document.cookie automatically
      // which syncs with the server-side cookie handling in middleware
    );
  }

  return supabaseClient;
}

// Create an anonymous client for public data (no auth context)
export function createAnonClient() {
  if (!anonClient) {
    anonClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );
  }

  return anonClient;
}
