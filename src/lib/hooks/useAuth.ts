"use client";

import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useEffect, useState, useRef } from "react";

interface UserProfile {
  username: string;
  usdp_balance: number;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
}

// Create a singleton supabase client to avoid multiple instances
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
  });
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const supabase = getSupabaseClient();

    // Get initial session
    const getInitialSession = async () => {
      try {
        // First try getSession for faster initial load
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log("[useAuth] Session check:", { 
          hasSession: !!session, 
          userId: session?.user?.id,
          error: sessionError?.message 
        });
        
        if (sessionError) {
          // Ignore abort errors
          if (sessionError.message?.includes('abort')) {
            return;
          }
          console.error("Session error:", sessionError);
        }
        
        if (!isMounted.current) return;
        
        if (session?.user) {
          // Fetch user profile
          const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("username, usdp_balance")
            .eq("user_id", session.user.id)
            .single();

          console.log("[useAuth] Profile fetch:", { profile, error: profileError?.message });

          if (profileError && !profileError.message?.includes('abort')) {
            console.error("Error fetching profile:", profileError);
          }

          if (!isMounted.current) return;

          setAuthState({
            user: session.user,
            profile: profile || null,
            isLoading: false,
          });
        } else {
          if (!isMounted.current) return;
          setAuthState({
            user: null,
            profile: null,
            isLoading: false,
          });
        }
      } catch (error: unknown) {
        // Ignore abort errors - they happen during fast refresh/unmount
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error("Error getting session:", error);
        if (!isMounted.current) return;
        setAuthState({
          user: null,
          profile: null,
          isLoading: false,
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted.current) return;
        
        if (session?.user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from("users")
            .select("username, usdp_balance")
            .eq("user_id", session.user.id)
            .single();

          if (!isMounted.current) return;

          setAuthState({
            user: session.user,
            profile: profile || null,
            isLoading: false,
          });
        } else {
          if (!isMounted.current) return;
          setAuthState({
            user: null,
            profile: null,
            isLoading: false,
          });
        }
      }
    );

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  return authState;
}
