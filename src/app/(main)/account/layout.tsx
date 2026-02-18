"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { colors } from "@/lib/constants/colors";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";

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
    case "issuer":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isIssuer, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // While auth is loading, show the issuer link as a placeholder so the
  // sidebar doesn't visibly jump when isIssuer resolves to true.
  const showIssuerLink = isLoading || isIssuer;

  // Build full sidebar links including conditional issuer dashboard
  const allLinks = showIssuerLink
    ? [...sidebarLinks, { href: "/account/issuer-dashboard", label: "Issuer Dashboard", icon: "issuer" }]
    : sidebarLinks;

  if (!isLoading && !user) {
    return null;
  }

  return (
    <div
      className="min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-3.5rem)] flex flex-col"
      style={{ backgroundColor: colors.backgroundDark }}
    >
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className="w-64 shrink-0 flex flex-col p-6 sticky top-12 lg:top-14 h-[calc(100vh-3rem)] lg:h-[calc(100vh-3.5rem)]"
          style={{
            backgroundColor: colors.background,
          }}
        >
          <nav className="space-y-2">
            {allLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-md transition-colors"
                  style={{
                    backgroundColor: isActive ? colors.box : "transparent",
                    color: link.icon === "issuer" ? colors.gold : colors.textPrimary,
                  }}
                >
                  <SidebarIcon icon={link.icon} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <button
              type="button"
              onClick={handleSignOut}
              suppressHydrationWarning
              className="w-full px-4 py-3 rounded-lg font-semibold transition-colors hover:opacity-90"
              style={{
                backgroundColor: colors.red,
                color: colors.textPrimary,
              }}
            >
              Sign Out
            </button>
          </div>
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
