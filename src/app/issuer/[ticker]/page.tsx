"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { IssuerTradingTemplate } from "@/components/templates/IssuerTradingTemplate";

/**
 * Issuer Trading Page
 * Dynamic route for viewing an issuer's trading page
 * Route: /issuer/[ticker]
 */
export default function IssuerTradingPage() {
  const params = useParams();
  const ticker = params.ticker as string;

  // Scroll to top on mount / ticker change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [ticker]);

  return <IssuerTradingTemplate ticker={ticker} />;
}
