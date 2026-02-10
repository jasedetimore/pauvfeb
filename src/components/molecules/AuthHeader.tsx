"use client";

import React from "react";
import { Header } from "./Header";
import { useAuth } from "@/lib/hooks/useAuth";
import { useIssuerStats } from "@/lib/hooks/useIssuerStats";

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
 * Also fetches issuer stats for the search dropdown price display
 */
export function AuthHeader({ navigationLinks, onSearch }: AuthHeaderProps) {
  const { user, profile, isLoading } = useAuth();
  const { statsMap } = useIssuerStats();

  // If still loading on initial render, show authenticated state if we have cached user
  // This prevents the flash of "login/signup" buttons
  return (
    <>
      <div suppressHydrationWarning>
        <Header
          navigationLinks={navigationLinks}
          isAuthenticated={!!user}
          username={profile?.username || user?.email?.split("@")[0]}
          onSearch={onSearch}
          statsMap={statsMap}
        />
      </div>
      {/* Spacer to offset fixed header height */}
      <div className="h-12 lg:h-14" />
    </>
  );
}
