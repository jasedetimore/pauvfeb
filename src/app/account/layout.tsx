"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { colors } from "@/lib/constants/colors";
import { AuthHeader } from "@/components/molecules/AuthHeader";

interface AccountLayoutProps {
  children: React.ReactNode;
}

const sidebarLinks = [
  { href: "/account", label: "Account", icon: "user" },
  { href: "/account/assets", label: "Assets", icon: "wallet" },
  { href: "/account/deposit", label: "Deposit", icon: "plus" },
];

function SidebarIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "user":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case "wallet":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    case "plus":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  const pathname = usePathname();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: colors.backgroundDark }}
    >
      <AuthHeader />
      
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className="w-64 shrink-0 flex flex-col p-6"
          style={{
            backgroundColor: colors.background,
          }}
        >
          <nav className="space-y-2">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
                  style={{
                    backgroundColor: isActive ? colors.boxLight : "transparent",
                    color: colors.textPrimary,
                  }}
                >
                  <SidebarIcon icon={link.icon} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Divider */}
        <div
          className="w-px flex-shrink-0"
          style={{ backgroundColor: colors.boxOutline }}
        />

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
