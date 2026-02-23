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

import { SidebarIcon, sidebarLinks } from "@/components/atoms";

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
          className="hidden lg:flex w-64 shrink-0 flex-col p-6 sticky top-12 lg:top-14 h-[calc(100vh-3rem)] lg:h-[calc(100vh-3.5rem)]"
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
          className="hidden lg:block w-px flex-shrink-0"
          style={{ backgroundColor: colors.boxOutline }}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
