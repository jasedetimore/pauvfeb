"use client";

import React from "react";
import { Header } from "./Header";
import { useAuth } from "@/lib/hooks/useAuth";

interface NavLink {
  href: string;
  label: string;
  active?: boolean;
}

interface AuthHeaderProps {
  navigationLinks?: NavLink[];
  onSearch?: (query: string) => void;
}

/**
 * AuthHeader - Header wrapper that provides authentication state
 */
export function AuthHeader({ navigationLinks, onSearch }: AuthHeaderProps) {
  const { user, profile, isLoading } = useAuth();

  // While loading, show as not authenticated to avoid hydration issues
  // The state will update client-side once auth is determined
  return (
    <div suppressHydrationWarning>
      <Header
        navigationLinks={navigationLinks}
        isAuthenticated={!isLoading && !!user}
        username={profile?.username || user?.email?.split("@")[0]}
        onSearch={onSearch}
      />
    </div>
  );
}
