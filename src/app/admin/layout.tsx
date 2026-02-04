"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/constants/colors";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (isLoading) return;
      
      if (!user) {
        router.push("/login");
        return;
      }

      // Check if user has admin claim in app_metadata
      const adminClaim = user.app_metadata?.admin === true;
      
      if (!adminClaim) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      setIsAdmin(true);
      setCheckingAdmin(false);
    }

    checkAdminStatus();
  }, [user, isLoading, router]);

  // Loading state
  if (isLoading || checkingAdmin) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.backgroundDark }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.gold }}
          />
          <p style={{ color: colors.textSecondary }}>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Not admin - show access denied
  if (isAdmin === false) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.backgroundDark }}
      >
        <div
          className="p-8 rounded-lg text-center max-w-md"
          style={{ backgroundColor: colors.box, border: `1px solid ${colors.red}` }}
        >
          <svg
            className="w-16 h-16 mx-auto mb-4"
            fill="none"
            stroke={colors.red}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h1 className="text-2xl font-bold mb-2" style={{ color: colors.red }}>
            Access Denied
          </h1>
          <p className="mb-6" style={{ color: colors.textSecondary }}>
            You do not have admin privileges to access this area.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2 rounded font-medium transition-colors"
            style={{
              backgroundColor: colors.box,
              color: colors.textPrimary,
              border: `1px solid ${colors.boxOutline}`,
            }}
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Admin layout
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
