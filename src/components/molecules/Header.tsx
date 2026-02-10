"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "../atoms/Logo";
import { SearchDropdown } from "./SearchDropdown";
import { colors } from "@/lib/constants/colors";
import { SoapPaymentButton } from "@/components/payments/SoapPaymentButton";
import { CachedIssuerStats } from "@/lib/hooks/useIssuerStats";

interface NavLink {
  href: string;
  label: string;
  active?: boolean;
}

interface HeaderProps {
  navigationLinks?: NavLink[];
  isAuthenticated?: boolean;
  username?: string;
  onSearch?: (query: string) => void;
  statsMap?: Map<string, CachedIssuerStats>;
}

/**
 * Header - Main navigation header with logo, nav links, search, and auth buttons
 */
export function Header({
  navigationLinks = [
    { href: "/", label: "Issuers", active: true },
    { href: "/list-yourself", label: "List Yourself" },
    { href: "/about", label: "About" },
  ],
  isAuthenticated = false,
  username,
  onSearch,
  statsMap,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Determine active link based on current pathname
  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href) || false;
  };

  return (
    <header role="banner" className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: colors.background, borderBottom: `1px solid ${colors.boxOutline}` }}>
      <div className="relative flex items-center justify-between px-4 sm:px-6 lg:px-9 py-2 lg:py-3">
        {/* Left Section: Logo and Navigation */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          {/* Logo */}
          <div className="flex items-center pr-1 shrink-0">
            <Link href="/" className="shrink-0 inline-flex items-center" title="PAUV">
              <Logo height={30} />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex gap-2 xl:gap-5 shrink-0">
            <nav className="flex items-center text-sm gap-2 xl:gap-5 text-center">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${link.active
                    ? "bg-box border border-box-outline"
                    : "hover:bg-box/50"
                    }`}
                  href={link.href}
                  style={{
                    backgroundColor: link.active ? colors.box : undefined,
                    borderColor: link.active ? colors.boxOutline : undefined,
                  }}
                >
                  {link.label}
                </Link>
              ))}
              {navigationLinks.map((link) => {
                const isActive = isLinkActive(link.href);
                return (
                  <Link
                    key={link.href}
                    className="px-4 py-2 font-medium whitespace-nowrap transition-colors"
                    href={link.href}
                    style={{
                      backgroundColor: isActive ? colors.box : "transparent",
                      borderRadius: "6px",
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Right Section: Search and Auth */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-2 sm:ml-4">
          {/* Search Bar - Desktop */}
          <div className="hidden lg:block">
            <SearchDropdown statsMap={statsMap} />
          </div>

          {/* Auth Buttons */}
          {!isAuthenticated ? (
            <>
              <Link
                href="/login"
                className="px-3 sm:px-4 py-2 rounded-lg text-sm border whitespace-nowrap"
                style={{
                  background: colors.box,
                  color: colors.textPrimary,
                  borderColor: "rgba(255, 255, 255, 0.2)",
                }}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-3 sm:px-4 py-2 rounded-lg text-sm border whitespace-nowrap"
                style={{
                  background: colors.gold,
                  color: colors.textDark,
                  borderColor: colors.goldBorder,
                }}
              >
                Sign Up
              </Link>
              <div className="hidden sm:block">
                <SoapPaymentButton />
              </div>
            </>
          ) : (
            <>
              <Link
                href="/account"
                className="px-4 py-2 rounded-lg text-sm font-semibold border whitespace-nowrap hover:opacity-90 transition-opacity"
                style={{
                  background: colors.gold,
                  color: colors.textDark,
                  borderColor: colors.goldBorder,
                }}
              >
                {username || "Account"}
              </Link>
              <div className="hidden sm:block">
                <SoapPaymentButton />
              </div>
            </>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-md transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden absolute top-full left-0 right-0 z-40 border-t shadow-lg"
          style={{
            backgroundColor: colors.boxLight,
            borderColor: colors.boxOutline,
          }}
        >
          <nav>
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                className={`block px-4 py-3 text-base font-medium border-b last:border-b-0 ${link.active ? "bg-white/10" : ""
                  }`}
                style={{ borderColor: colors.boxOutline }}
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
            <div className="p-4 border-t" style={{ borderColor: colors.boxOutline }}>
              <SoapPaymentButton />
            </div>
            {navigationLinks.map((link) => {
              const isActive = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  className="block px-4 py-3 text-base font-medium border-b last:border-b-0"
                  style={{
                    borderColor: colors.boxOutline,
                    backgroundColor: isActive ? colors.box : "transparent",
                  }}
                  href={link.href}
              >
                {link.label}
              </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
