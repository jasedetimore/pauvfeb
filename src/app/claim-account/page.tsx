"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { colors } from "@/lib/constants/colors";
import { ClaimForm } from "@/components/molecules/ClaimForm";
import { LoadingSpinner } from "@/components/atoms/LoadingSpinner";

interface InviteData {
  email: string;
  issuerName: string;
  issuerTicker: string;
}

function ClaimAccountContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("No invite token provided. Please use the link from your email.");
      setIsLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`/api/claim-account?token=${encodeURIComponent(token)}`);
        const result = await res.json();

        if (!res.ok || !result.success) {
          setError(result.error || "Invalid invite link");
        } else {
          setInviteData(result.data);
        }
      } catch {
        setError("Failed to validate invite link. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ backgroundColor: colors.backgroundDark }}
    >
      <div
        className="w-full max-w-md rounded-xl p-8"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: colors.gold, fontFamily: "'EB Garamond', serif" }}
          >
            PAUV
          </h1>
          <h2
            className="text-lg font-semibold font-mono"
            style={{ color: colors.textPrimary }}
          >
            Complete Your Pauv Profile
          </h2>
          <p
            className="text-xs font-mono mt-2"
            style={{ color: colors.textSecondary }}
          >
            Set your password to claim your Issuer account
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <LoadingSpinner />
            <p
              className="text-sm font-mono"
              style={{ color: colors.textSecondary }}
            >
              Validating invite...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div
              className="text-4xl mb-4"
              role="img"
              aria-label="error"
            >
              ⚠️
            </div>
            <p
              className="text-sm font-mono mb-4"
              style={{ color: colors.red }}
            >
              {error}
            </p>
            <a
              href="/"
              className="text-sm font-mono underline transition-opacity hover:opacity-80"
              style={{ color: colors.gold }}
            >
              Return to Home
            </a>
          </div>
        ) : inviteData && token ? (
          <ClaimForm
            email={inviteData.email}
            issuerName={inviteData.issuerName}
            issuerTicker={inviteData.issuerTicker}
            token={token}
          />
        ) : null}
      </div>
    </div>
  );
}

function ClaimAccountFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ backgroundColor: colors.backgroundDark }}
    >
      <div
        className="w-full max-w-md rounded-xl p-8"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <LoadingSpinner />
          <p
            className="text-sm font-mono"
            style={{ color: colors.textSecondary }}
          >
            Loading invite...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ClaimAccountPage() {
  return (
    <Suspense fallback={<ClaimAccountFallback />}>
      <ClaimAccountContent />
    </Suspense>
  );
}
