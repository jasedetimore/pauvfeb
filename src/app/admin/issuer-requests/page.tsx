"use client";

import { useEffect, useState, useCallback } from "react";
import { colors } from "@/lib/constants/colors";
import { PrimaryButton } from "@/components/atoms/PrimaryButton";

interface IssuerRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  social_media_platform: string;
  social_media_handle: string;
  desired_ticker: string;
  message: string | null;
  status: string;
  created_at: string;
  user_id: string | null;
}

interface ApprovalResult {
  requestId: string;
  emailSent: boolean;
  emailError: string | null;
  linkedExistingUser: boolean;
}

export default function IssuerRequestsPage() {
  const [requests, setRequests] = useState<IssuerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState<string | null>(null);
  const [approvalResults, setApprovalResults] = useState<ApprovalResult[]>([]);
  const [resending, setResending] = useState<string | null>(null);
  const [resendResults, setResendResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/issuer-requests");

      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(result.error || "Failed to fetch requests");
      } else {
        setRequests(result.data || []);
      }
    } catch {
      setError("Failed to load issuer requests");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (requestId: string) => {
    setApproving(requestId);
    setError("");

    try {
      const res = await fetch("/api/admin/issuer-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(result.error || "Failed to approve request");
      } else {
        // Update the request in the local list
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, status: "approved" } : r
          )
        );

        // Store approval result
        setApprovalResults((prev) => [
          ...prev,
          {
            requestId,
            emailSent: result.data.emailSent,
            emailError: result.data.emailError || null,
            linkedExistingUser: result.data.linkedExistingUser || false,
          },
        ]);
      }
    } catch {
      setError("Failed to approve request");
    } finally {
      setApproving(null);
    }
  };

  const handleResendEmail = async (requestId: string) => {
    setResending(requestId);
    setError("");

    try {
      const res = await fetch("/api/admin/issuer-requests/resend-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setResendResults((prev) => ({
          ...prev,
          [requestId]: { success: false, message: result.error || "Failed to resend email" },
        }));
      } else {
        setResendResults((prev) => ({
          ...prev,
          [requestId]: { success: true, message: "Approval email sent" },
        }));
      }
    } catch {
      setResendResults((prev) => ({
        ...prev,
        [requestId]: { success: false, message: "Failed to resend email" },
      }));
    } finally {
      setResending(null);
    }
  };

  const getApprovalResult = (requestId: string) =>
    approvalResults.find((r) => r.requestId === requestId);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold font-mono"
          style={{ color: colors.textPrimary }}
        >
          Issuer Requests
        </h1>
        <p
          className="text-sm font-mono mt-1"
          style={{ color: colors.textSecondary }}
        >
          Review and approve issuer applications. Existing users get linked directly; new users receive an invite email.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="px-4 py-3 rounded-lg text-sm font-mono"
          style={{
            color: colors.red,
            backgroundColor: `${colors.red}15`,
            border: `1px solid ${colors.red}30`,
          }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div
            className="animate-spin h-6 w-6 border-2 rounded-full"
            style={{
              borderColor: colors.boxOutline,
              borderTopColor: colors.gold,
            }}
          />
        </div>
      ) : (
        <>
          {/* Pending Requests */}
          <section>
            <h2
              className="text-lg font-semibold font-mono mb-4 flex items-center gap-2"
              style={{ color: colors.textPrimary }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors.gold }}
              />
              Pending ({pendingRequests.length})
            </h2>

            {pendingRequests.length === 0 ? (
              <p
                className="text-sm font-mono py-8 text-center"
                style={{ color: colors.textMuted }}
              >
                No pending requests
              </p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    onApprove={handleApprove}
                    isApproving={approving === req.id}
                    approvalResult={getApprovalResult(req.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Approved Requests */}
          {approvedRequests.length > 0 && (
            <section>
              <h2
                className="text-lg font-semibold font-mono mb-4 flex items-center gap-2"
                style={{ color: colors.textPrimary }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors.green }}
                />
                Approved ({approvedRequests.length})
              </h2>
              <div className="space-y-3">
                {approvedRequests.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    onApprove={handleApprove}
                    isApproving={false}
                    approvalResult={getApprovalResult(req.id)}
                    onResendEmail={handleResendEmail}
                    isResending={resending === req.id}
                    resendResult={resendResults[req.id]}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Request Card Sub-component ─── */

function RequestCard({
  request,
  onApprove,
  isApproving,
  approvalResult,
  onResendEmail,
  isResending,
  resendResult,
}: {
  request: IssuerRequest;
  onApprove: (id: string) => void;
  isApproving: boolean;
  approvalResult?: ApprovalResult;
  onResendEmail?: (id: string) => void;
  isResending?: boolean;
  resendResult?: { success: boolean; message: string };
}) {
  const isPending = request.status === "pending";
  const isApproved = request.status === "approved";

  return (
    <div
      className="rounded-lg p-5 space-y-3"
      style={{
        backgroundColor: colors.box,
        border: `1px solid ${colors.boxOutline}`,
      }}
    >
      {/* Top row: Name, Ticker, Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="font-bold text-base font-mono"
            style={{ color: colors.textPrimary }}
          >
            {request.name}
          </span>
          <span
            className="text-xs font-mono font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: colors.gold, color: colors.textDark }}
          >
            {request.desired_ticker}
          </span>
          {request.user_id && (
            <span
              className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded"
              style={{
                backgroundColor: `${colors.green}20`,
                color: colors.green,
              }}
            >
              Existing User
            </span>
          )}
        </div>
        <span
          className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded"
          style={{
            backgroundColor: isPending ? `${colors.gold}20` : `${colors.green}20`,
            color: isPending ? colors.gold : colors.green,
          }}
        >
          {request.status}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div>
          <span style={{ color: colors.textMuted }}>Email: </span>
          <span style={{ color: colors.textSecondary }}>{request.email}</span>
        </div>
        <div>
          <span style={{ color: colors.textMuted }}>Phone: </span>
          <span style={{ color: colors.textSecondary }}>{request.phone}</span>
        </div>
        <div>
          <span style={{ color: colors.textMuted }}>Platform: </span>
          <span style={{ color: colors.textSecondary }}>
            {request.social_media_platform}
          </span>
        </div>
        <div>
          <span style={{ color: colors.textMuted }}>Handle: </span>
          <span style={{ color: colors.textSecondary }}>
            {request.social_media_handle}
          </span>
        </div>
      </div>

      {/* Message */}
      {request.message && (
        <p
          className="text-xs font-mono leading-relaxed"
          style={{ color: colors.textSecondary }}
        >
          &quot;{request.message}&quot;
        </p>
      )}

      {/* Submitted date */}
      <p
        className="text-[10px] font-mono"
        style={{ color: colors.textMuted }}
      >
        Submitted {new Date(request.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>

      {/* Approval result */}
      {approvalResult && (
        <div
          className="px-3 py-2 rounded-md text-xs font-mono"
          style={{
            backgroundColor: approvalResult.linkedExistingUser
              ? `${colors.green}10`
              : approvalResult.emailSent
                ? `${colors.green}10`
                : `${colors.red}10`,
            border: `1px solid ${
              approvalResult.linkedExistingUser || approvalResult.emailSent
                ? colors.green
                : colors.red
            }30`,
          }}
        >
          {approvalResult.linkedExistingUser ? (
            <p style={{ color: colors.green }}>
              ✓ Approved — Account linked.{" "}
              {approvalResult.emailSent
                ? `Approval email sent to ${request.email}.`
                : approvalResult.emailError
                  ? `⚠ Approval email failed: ${approvalResult.emailError}`
                  : "Issuer access granted immediately."}
            </p>
          ) : approvalResult.emailSent ? (
            <p style={{ color: colors.green }}>
              ✓ Approved — Invite email sent to {request.email}
            </p>
          ) : (
            <p style={{ color: colors.red }}>
              ⚠ Approved but invite email failed: {approvalResult.emailError}
            </p>
          )}
        </div>
      )}

      {/* Approve button */}
      {isPending && !approvalResult && (
        <div className="pt-1">
          <PrimaryButton
            onClick={() => onApprove(request.id)}
            isLoading={isApproving}
          >
            {isApproving
              ? "Approving..."
              : request.user_id
                ? "Approve & Link Account"
                : "Approve Issuer"}
          </PrimaryButton>
        </div>
      )}

      {/* Already approved badge (for previously approved, no result yet) */}
      {isApproved && !approvalResult && (
        <p
          className="text-xs font-mono flex items-center gap-1"
          style={{ color: colors.green }}
        >
          ✓ Previously approved
        </p>
      )}

      {/* Resend email button for approved existing users */}
      {isApproved && request.user_id && onResendEmail && (
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => onResendEmail(request.id)}
            disabled={isResending}
            className="text-xs font-mono font-semibold px-3 py-1.5 rounded-md transition-colors"
            style={{
              backgroundColor: colors.gold,
              color: colors.textDark,
              opacity: isResending ? 0.6 : 1,
              cursor: isResending ? "not-allowed" : "pointer",
            }}
          >
            {isResending ? "Sending..." : "Resend Approval Email"}
          </button>
          {resendResult && (
            <span
              className="text-xs font-mono"
              style={{ color: resendResult.success ? colors.green : colors.red }}
            >
              {resendResult.success
                ? `✓ Email sent to ${request.email}`
                : `⚠ ${resendResult.message}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
