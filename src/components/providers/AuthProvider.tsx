"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  username: string;
  usdp_balance: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    // 1. Set up auth state listener for FUTURE auth changes (sign in/out)
    // Don't use this for initial session - use getUser() instead
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      // Only handle auth changes AFTER initial hydration is complete
      // The INITIAL_SESSION event can fire with null before getUser() validates
      if (!isInitialized && event === "INITIAL_SESSION") {
        // Skip - let checkSession handle initial state
        return;
      }
      
      // Keep this callback synchronous to prevent stale token deadlocks
      if (session?.user) {
        setUser(session.user);
        setIsAdmin(session.user.app_metadata?.admin === true);
        // Fetch profile in background (non-blocking)
        supabase
          .from("users")
          .select("username, usdp_balance")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }: { data: UserProfile | null }) => {
            if (data) setProfile(data);
          });
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    // 2. Check active session with a timeout to prevent deadlocks
    // Use Promise.race to force a fallback if getUser() hangs
    const checkSession = async () => {
      const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((resolve) => {
        setTimeout(() => {
          resolve({ data: { user: null }, error: new Error("Auth timeout") });
        }, 2000);
      });

      try {
        const result = await Promise.race([
          supabase.auth.getUser(),
          timeoutPromise,
        ]);

        const { data: { user: authUser }, error } = result;
        
        if (error || !authUser) {
          // No valid session or timeout - clear state
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        } else {
          // User exists - set state directly
          setUser(authUser);
          setIsAdmin(authUser.app_metadata?.admin === true);
          // Fetch profile in background (non-blocking)
          supabase
            .from("users")
            .select("username, usdp_balance")
            .eq("user_id", authUser.id)
            .single()
            .then(({ data }: { data: UserProfile | null }) => {
              if (data) setProfile(data);
            });
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      } finally {
        // Always mark as initialized and done loading after checkSession
        setIsInitialized(true);
        setIsLoading(false);
      }
    };
    
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
