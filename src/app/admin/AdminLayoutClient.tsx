"use client";

import React from "react";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { colors } from "@/lib/constants/colors";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  user: User;
}

/**
 * Client Component for Admin Layout UI
 * 
 * This component only handles the UI rendering.
 * All auth checks are done server-side in the parent layout.
 */
export function AdminLayoutClient({ children, user }: AdminLayoutClientProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.backgroundDark }}>
      {/* Admin Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: colors.navbarBg,
          borderColor: colors.boxOutline,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ color: colors.gold }}>
                PAUV
              </span>
            </Link>
            <span
              className="px-2 py-1 rounded text-xs font-semibold uppercase"
              style={{
                backgroundColor: colors.red,
                color: colors.textPrimary,
              }}
            >
              Admin
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <span
              className="text-sm"
              style={{ color: colors.textSecondary }}
            >
              {user.email}
            </span>
            <Link
              href="/admin"
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: colors.textPrimary }}
            >
              Dashboard
            </Link>
            <Link
              href="/"
              className="text-sm transition-colors hover:opacity-80"
              style={{ color: colors.textSecondary }}
            >
              Exit Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
