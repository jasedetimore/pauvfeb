"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
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
  isIssuer: boolean;
  issuerId: string | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
  isIssuer: false,
  issuerId: null,
  refreshProfile: async () => { },
});

/** Helper: apply user data from a Supabase User object to state setters */
function applyUser(
  authUser: User,
  setUser: React.Dispatch<React.SetStateAction<User | null>>,
  setIsAdmin: React.Dispatch<React.SetStateAction<boolean>>,
  setIsIssuer: React.Dispatch<React.SetStateAction<boolean>>,
  setIssuerId: React.Dispatch<React.SetStateAction<string | null>>,
  supabase: ReturnType<typeof createClient>,
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
) {
  setUser(authUser);
  setIsAdmin(authUser.app_metadata?.admin === true);
  setIsIssuer(authUser.app_metadata?.issuer === true);
  setIssuerId(authUser.app_metadata?.issuer_id || null);
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

function clearUser(
  setUser: React.Dispatch<React.SetStateAction<User | null>>,
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  setIsAdmin: React.Dispatch<React.SetStateAction<boolean>>,
  setIsIssuer: React.Dispatch<React.SetStateAction<boolean>>,
  setIssuerId: React.Dispatch<React.SetStateAction<string | null>>,
) {
  setUser(null);
  setProfile(null);
  setIsAdmin(false);
  setIsIssuer(false);
  setIssuerId(null);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isIssuer, setIsIssuer] = useState(false);
  const [issuerId, setIssuerId] = useState<string | null>(null);

  // Use a ref so the onAuthStateChange callback always sees the current value
  const isInitializedRef = useRef(false);
  // Track whether INITIAL_SESSION already provided a valid user
  const hadInitialUserRef = useRef(false);

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false; // guard against setting state after unmount

    // 1. Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (cancelled) return;

      if (event === "INITIAL_SESSION") {
        // Use the cached session as a fast-path so the UI renders immediately
        // (e.g. the issuer sidebar link appears without waiting for getUser()).
        // checkSession() will still run afterwards and overwrite with the
        // server-validated user if needed.
        if (!isInitializedRef.current && session?.user) {
          hadInitialUserRef.current = true;
          applyUser(session.user, setUser, setIsAdmin, setIsIssuer, setIssuerId, supabase, setProfile);
          // Don't setIsLoading(false) here — let checkSession finalise loading
        }
        return;
      }

      // Keep this callback synchronous to prevent stale token deadlocks
      if (session?.user) {
        applyUser(session.user, setUser, setIsAdmin, setIsIssuer, setIssuerId, supabase, setProfile);
      } else {
        clearUser(setUser, setProfile, setIsAdmin, setIsIssuer, setIssuerId);
      }
      setIsLoading(false);
    });

    // 2. Check active session with supabase.auth.getUser() for initial hydration
    // Use Promise.race to force a fallback if getUser() hangs
    const checkSession = async () => {
      const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((resolve) => {
        setTimeout(() => {
          resolve({ data: { user: null }, error: new Error("Auth timeout") });
        }, 5000);
      });

      try {
        const result = await Promise.race([
          supabase.auth.getUser(),
          timeoutPromise,
        ]);

        if (cancelled) return;

        const { data: { user: authUser }, error } = result;

        if (error || !authUser) {
          // If INITIAL_SESSION already provided a valid user, don't clear
          // state here — let onAuthStateChange handle corrections
          // (e.g. SIGNED_OUT). This prevents the flash-then-disappear
          // when getUser() fails temporarily (expired token before
          // auto-refresh, transient network error, timeout, etc.).
          if (!hadInitialUserRef.current) {
            clearUser(setUser, setProfile, setIsAdmin, setIsIssuer, setIssuerId);
          }
        } else {
          // Server-validated user — authoritative source of truth
          applyUser(authUser, setUser, setIsAdmin, setIsIssuer, setIssuerId, supabase, setProfile);
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Auth check failed:", error);
        if (!hadInitialUserRef.current) {
          clearUser(setUser, setProfile, setIsAdmin, setIsIssuer, setIssuerId);
        }
      } finally {
        if (!cancelled) {
          isInitializedRef.current = true;
          setIsLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = React.useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("users")
      .select("username, usdp_balance")
      .eq("user_id", user.id)
      .single();
    if (data) setProfile(data);
  }, [user, supabase]);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, isAdmin, isIssuer, issuerId, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
