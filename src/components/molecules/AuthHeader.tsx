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

  // If still loading on initial render, show authenticated state if we have cached user
  // This prevents the flash of "login/signup" buttons
  return (
    <div suppressHydrationWarning>
      <Header
        navigationLinks={navigationLinks}
        isAuthenticated={!!user}
        username={profile?.username || user?.email?.split("@")[0]}
        onSearch={onSearch}
      />
    </div>
  );
}
