"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /admin redirects to /admin/create-issuer (first sidebar item).
 */
export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/create-issuer");
  }, [router]);

  return null;
}
