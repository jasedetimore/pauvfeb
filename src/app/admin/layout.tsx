import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminLayoutClient } from "./AdminLayoutClient";

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Server Component for Admin Layout
 * 
 * Auth checks are handled by middleware, but we double-check here for safety.
 * This prevents any flash/redirect issues since auth is validated server-side.
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Double-check auth (middleware should have caught this already)
  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  // Double-check admin status (middleware should have caught this already)
  const isAdmin = user.app_metadata?.admin === true;
  if (!isAdmin) {
    redirect("/");
  }

  // Render the client layout wrapper with the admin UI
  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>;
}
