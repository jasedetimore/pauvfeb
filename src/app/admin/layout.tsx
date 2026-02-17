import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminLayoutClient } from "./AdminLayoutClient";

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Server Component for Admin Layout
 *
 * In production, Cloudflare Zero Trust gates admin.pauv.com — only @pauv.com
 * emails get through. We read the authenticated email from the CF header.
 *
 * In development, falls back to Supabase auth + admin claim check.
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  const headersList = await headers();
  const cfEmail = headersList.get("cf-access-authenticated-user-email");

  // Production path: Cloudflare Zero Trust provides the authenticated email
  if (cfEmail) {
    if (!cfEmail.endsWith("@pauv.com")) {
      redirect("/");
    }
    return <AdminLayoutClient email={cfEmail}>{children}</AdminLayoutClient>;
  }

  // Development fallback: use Supabase auth + admin claim
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  const isAdmin = user.app_metadata?.admin === true;
  if (!isAdmin) {
    redirect("/");
  }

  return <AdminLayoutClient email={user.email || "unknown"}>{children}</AdminLayoutClient>;
}
