// Auth header utility for client-side API calls
// Uses Supabase auth (NOT next-auth) to get the current session token

import { createClient } from '@/lib/supabase/client';

/**
 * Get authorization headers for API calls.
 * Retrieves the current Supabase session token and returns
 * headers with the Bearer token.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated. Please sign in.');
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}
