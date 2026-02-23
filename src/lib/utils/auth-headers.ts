import { createClient } from '@/lib/supabase/client';

/**
 * Get authorization headers for API calls.
 * Retrieves the current Supabase session token and returns
 * headers with the Bearer token.
 *
 * Proactively refreshes the session if the token is close to expiry
 * (within 60 seconds) to avoid sending stale tokens.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error('Not authenticated. Please sign in.');
  }

  // Refresh if token expires within 60 seconds
  const expiresAt = session.expires_at ?? 0;
  if (Date.now() / 1000 > expiresAt - 60) {
    const { data: { session: refreshed } } = await supabase.auth.refreshSession();
    if (refreshed?.access_token) {
      return { Authorization: `Bearer ${refreshed.access_token}` };
    }
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}
