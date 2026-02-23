"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { SidebarIcon, sidebarLinks } from "@/components/atoms";
import { colors } from "@/lib/constants/colors";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface MobileAccountSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    pathname: string;
    isIssuer?: boolean;
}

export function MobileAccountSidebar({ isOpen, onClose, pathname, isIssuer }: MobileAccountSidebarProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    async function handleSignOut() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
        onClose();
    }

    // Combine links
    const allLinks = isIssuer
        ? [...sidebarLinks, { href: "/account/issuer-dashboard", label: "Issuer Dashboard", icon: "issuer" }]
        : sidebarLinks;

    if (!mounted) return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 z-[100] transition-opacity duration-300 lg:hidden ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
                style={{ backdropFilter: "blur(4px)" }}
            />

            {/* Sidebar drawer */}
            <div
                className={`fixed top-0 right-0 bottom-0 w-[60vw] z-[101] transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col shadow-2xl`}
                style={{
                    backgroundColor: "rgba(0, 0, 0, 0)", // Dark grey glassy background
                    backdropFilter: "blur(10px)",
                    borderLeft: `1px solid ${colors.boxOutline}`,
                    transform: isOpen ? "translateX(0)" : "translateX(100%)",
                    pointerEvents: "auto",
                }}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                }}
            >
                <div
                    className="p-6 flex-1 flex flex-col overflow-y-auto"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                >
                    <nav className="space-y-2 mt-4">
                        {allLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClose();
                                    }}
                                    className="flex items-center gap-4 px-4 py-3 rounded-lg transition-colors text-[15px] font-medium"
                                    style={{
                                        backgroundColor: isActive ? "#282828" : "transparent",
                                        color: link.icon === "issuer" ? colors.gold : "#ffffff",
                                    }}
                                >
                                    <SidebarIcon icon={link.icon} />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-6 pb-2">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSignOut();
                            }}
                            className="w-full px-4 py-3.5 rounded-xl font-semibold transition-colors hover:opacity-90 shadow-sm"
                            style={{
                                backgroundColor: colors.red,
                                color: "#ffffff",
                            }}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}
