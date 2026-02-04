"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "../atoms/Logo";
import { colors } from "@/lib/constants/colors";

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
}

/**
 * Header - Main navigation header with logo, nav links, search, and auth buttons
 */
export function Header({
  navigationLinks = [
    { href: "/", label: "Issuers", active: true },
    { href: "/indexes", label: "Indexes" },
  ],
  isAuthenticated = false,
  username,
  onSearch,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <header role="banner" className="relative z-50">
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
          <div
            className="hidden lg:flex p-1 rounded-xl gap-2 xl:gap-5 shrink-0"
            style={{ backgroundColor: colors.navbarBg }}
          >
            <nav className="flex items-center text-sm gap-2 xl:gap-5 text-center">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    link.active
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
            </nav>
          </div>
        </div>

        {/* Right Section: Search and Auth */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-2 sm:ml-4">
          {/* Search Bar - Desktop */}
          <div className="hidden lg:block relative">
            <form onSubmit={handleSearchSubmit} className="flex items-center relative">
              <svg
                className="absolute left-3 w-4 h-4"
                style={{ color: colors.textMuted }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search tickers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3 py-2 rounded-lg text-sm border w-[280px] focus:outline-none focus:ring-1"
                style={{
                  background: colors.navbarBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                }}
              />
            </form>
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
            </>
          ) : (
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
                className={`block px-4 py-3 text-base font-medium border-b last:border-b-0 ${
                  link.active ? "bg-white/10" : ""
                }`}
                style={{ borderColor: colors.boxOutline }}
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
