"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { colors } from "@/lib/constants/colors";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  user: User;
}

const NAV_ITEMS = [
  { href: "/admin/create-issuer", label: "Create Issuer", icon: "+" },
  { href: "/admin/list-trading", label: "List for Trading", icon: "📈" },
  { href: "/admin/edit-issuer", label: "Edit Issuer", icon: "✏️" },
  { href: "/admin/tags", label: "Tags", icon: "🏷️" },
  { href: "/admin/issuer-links", label: "Issuer Links", icon: "🔗" },
] as const;

/**
 * Client Component for Admin Layout UI
 *
 * Renders a persistent left sidebar with navigation and
 * a content area on the right.
 */
export function AdminLayoutClient({ children, user }: AdminLayoutClientProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.backgroundDark }}>
      {/* ─── Left Sidebar ─── */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col border-r sticky top-0 h-screen"
        style={{
          backgroundColor: colors.navbarBg,
          borderColor: colors.boxOutline,
        }}
      >
        {/* Logo / Brand */}
        <div
          className="px-4 py-4 border-b flex items-center gap-2"
          style={{ borderColor: colors.boxOutline }}
        >
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold" style={{ color: colors.gold }}>
              PAUV
            </span>
          </Link>
          <span
            className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase"
            style={{
              backgroundColor: colors.red,
              color: colors.textPrimary,
            }}
          >
            Admin
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? colors.boxLight : "transparent",
                  color: isActive ? colors.gold : colors.textSecondary,
                  border: isActive
                    ? `1px solid ${colors.boxOutline}`
                    : "1px solid transparent",
                }}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info / exit */}
        <div
          className="px-4 py-3 border-t space-y-2"
          style={{ borderColor: colors.boxOutline }}
        >
          <p
            className="text-xs truncate"
            style={{ color: colors.textSecondary }}
            title={user.email ?? ""}
          >
            {user.email}
          </p>
          <Link
            href="/"
            className="block text-xs transition-colors hover:opacity-80"
            style={{ color: colors.textMuted }}
          >
            ← Exit Admin
          </Link>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 min-w-0 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
