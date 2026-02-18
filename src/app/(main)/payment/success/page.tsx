'use client';

import { useEffect, useState, Suspense, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { Button } from '@/components/atoms/Button';
import { clearCheckoutState, getCheckoutState } from '@/lib/utils/payment-storage';
import { checkPaymentStatus } from '@/lib/services/payment-api';
import { usePaymentWebSocket } from '@/lib/hooks/usePaymentWebSocket';
import { XCircle, CheckCircle, Clock } from 'lucide-react';
import { colors } from '@/lib/constants/colors';

const TIMEOUT_MS = 120000; // 2 minutes
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 10;

type PaymentStatus =
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'held'
  | 'expired'
  | 'terminally_failed'
  | 'returned'
  | 'not_completed'
  | 'submitted'
  | 'verifying';

function PaymentSuccessPageContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus>('verifying');
  const [redirecting, setRedirecting] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [countdown, setCountdown] = useState(3);

  const [checkoutId, setCheckoutId] = useState<string | null>(() => {
    // Prefer session storage (set by payment-api before redirect)
    const checkoutState = getCheckoutState();
    if (checkoutState?.checkout_id) return checkoutState.checkout_id;
    // Fallback to URL param if present
    const urlCheckoutId = searchParams.get('checkout_id');
    return urlCheckoutId || null;
  });

  const [type, setType] = useState<'deposit' | 'withdrawal' | null>(() => {
    const urlType = searchParams.get('type') as 'deposit' | 'withdrawal' | null;
    if (urlType) return urlType;
    const checkoutState = getCheckoutState();
    return checkoutState?.type || null;
  });

  const pollCountRef = useRef(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isResolvedRef = useRef(false);

  const isDeposit = type === 'deposit';
  const isWithdrawal = type === 'withdrawal';

  const handleRedirect = useCallback(() => {
    if (redirecting) return;
    setRedirecting(true);
    clearCheckoutState();
    window.location.replace('/account/deposit');
  }, [redirecting]);

  const getErrorMessage = useCallback(
    (errorStatus: string): string => {
      switch (errorStatus) {
        case 'failed':
          return isDeposit
            ? 'Your deposit could not be processed. Please try again.'
            : 'Your withdrawal could not be processed. Please try again.';
        case 'terminally_failed':
          return 'Payment processing failed permanently. Please contact support.';
        case 'expired':
          return 'Payment session expired. Please initiate a new payment.';
        default:
          return 'Payment failed. Please try again.';
      }
    },
    [isDeposit]
  );

  const handlePaymentStatus = useCallback(
    (paymentStatus: PaymentStatus, errorMessage?: string) => {
      if (isResolvedRef.current) return;

      isResolvedRef.current = true;

      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = null;
      }

      setStatus(paymentStatus);

      if (errorMessage) {
        setMessage(errorMessage);
      }

      if (paymentStatus === 'succeeded') {
        clearCheckoutState();
        setCountdown(3);
      } else if (
        paymentStatus === 'failed' ||
        paymentStatus === 'expired' ||
        paymentStatus === 'terminally_failed' ||
        paymentStatus === 'returned' ||
        paymentStatus === 'not_completed'
      ) {
        clearCheckoutState();
      }
    },
    []
  );

  // WebSocket handler
  usePaymentWebSocket({
    enabled: !!checkoutId && !isResolvedRef.current,
    onPaymentUpdate: (event) => {
      if (event.checkout_id === checkoutId) {
        if (event.status === 'succeeded') {
          handlePaymentStatus('succeeded');
        } else if (
          event.status === 'failed' ||
          event.status === 'terminally_failed' ||
          event.status === 'expired'
        ) {
          handlePaymentStatus(event.status, getErrorMessage(event.status));
        } else if (event.status === 'returned') {
          handlePaymentStatus('returned', 'Payment was returned or refunded');
        }
      }
    },
  });

  // Polling function
  const pollStatus = useCallback(async () => {
    if (!checkoutId || isResolvedRef.current) return;

    try {
      const response = await checkPaymentStatus(checkoutId);

      if (response.success && response.data) {
        const paymentStatus = response.data.status;

        if (paymentStatus === 'succeeded') {
          handlePaymentStatus('succeeded');
        } else if (
          paymentStatus === 'failed' ||
          paymentStatus === 'terminally_failed' ||
          paymentStatus === 'expired'
        ) {
          handlePaymentStatus(paymentStatus, getErrorMessage(paymentStatus));
        } else if (paymentStatus === 'pending' || paymentStatus === 'held') {
          pollCountRef.current++;
          if (pollCountRef.current >= MAX_POLLS) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            // Soap redirected the user back, so the user completed checkout.
            // But we haven't received the webhook confirmation yet.
            // Show "submitted" — not "succeeded" — to be honest about the state.
            handlePaymentStatus('submitted');
          }
        }
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('not found')) {
        pollCountRef.current++;
        if (pollCountRef.current >= MAX_POLLS) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          // Transaction record not found but Soap redirected user here
          handlePaymentStatus('submitted');
        }
      } else {
        console.error('Error checking payment status:', error);
      }
    }
  }, [checkoutId, handlePaymentStatus, getErrorMessage]);

  // Initial check and setup
  useEffect(() => {
    if (!checkoutId) {
      const checkoutState = getCheckoutState();
      if (checkoutState?.checkout_id) {
        setCheckoutId(checkoutState.checkout_id);
        if (!type && checkoutState.type) {
          setType(checkoutState.type);
        }
        return;
      }

      setStatus('not_completed');
      setMessage('Invalid checkout ID. Please check your payment status in your wallet.');
      return;
    }

    pollStatus();

    pollIntervalRef.current = setInterval(() => {
      if (pollCountRef.current < MAX_POLLS && !isResolvedRef.current) {
        pollStatus();
      }
    }, POLL_INTERVAL_MS);

    timeoutTimerRef.current = setTimeout(() => {
      if (!isResolvedRef.current) {
        handlePaymentStatus(
          'not_completed',
          'Payment was not completed. If you closed the payment page or did not complete the transaction, please try again.'
        );
      }
    }, TIMEOUT_MS);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    };
  }, [checkoutId, pollStatus, handlePaymentStatus, type]);

  // Auto-redirect countdown for success or submitted
  useEffect(() => {
    if (status !== 'succeeded' && status !== 'submitted') return;
    if (redirecting) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      handleRedirect();
    }
  }, [status, countdown, redirecting, handleRedirect]);

  const getTitle = (): string => {
    switch (status) {
      case 'succeeded':
        return isDeposit
          ? 'Deposit Successful'
          : isWithdrawal
            ? 'Withdrawal Successful'
            : 'Payment Successful';
      case 'failed':
        return isDeposit
          ? 'Deposit Failed'
          : isWithdrawal
            ? 'Withdrawal Failed'
            : 'Payment Failed';
      case 'terminally_failed':
        return 'Payment Blocked';
      case 'expired':
        return 'Payment Expired';
      case 'returned':
        return 'Payment Returned';
      case 'submitted':
        return isDeposit
          ? 'Deposit Submitted'
          : isWithdrawal
            ? 'Withdrawal Submitted'
            : 'Payment Submitted';
      case 'not_completed':
        return isDeposit
          ? 'Deposit Not Completed'
          : isWithdrawal
            ? 'Withdrawal Not Completed'
            : 'Payment Not Completed';
      default:
        return 'Verifying Payment...';
    }
  };

  // Submitted state (checkout completed on Soap side, awaiting webhook confirmation)
  if (status === 'submitted') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: colors.background }}
      >
        <div
          className="max-w-md w-full rounded-lg p-8 text-center space-y-6"
          style={{
            backgroundColor: colors.box,
            border: `1px solid ${colors.boxOutline}`,
          }}
        >
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${colors.gold}33` }}
            >
              <Clock className="w-10 h-10" style={{ color: colors.gold }} />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-mono" style={{ color: colors.textPrimary }}>
              {getTitle()}
            </h1>
            <p className="text-sm font-mono" style={{ color: colors.textSecondary }}>
              {isDeposit
                ? 'Your deposit has been submitted and is being processed. Your balance will update shortly.'
                : 'Your withdrawal has been submitted and is being processed. You will be notified once complete.'}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-mono" style={{ color: colors.textSecondary }}>
              Redirecting to wallet in{' '}
              <span className="font-bold" style={{ color: colors.gold }}>
                {countdown}
              </span>{' '}
              seconds...
            </p>

            <Button
              onClick={handleRedirect}
              disabled={redirecting}
              className="w-full font-mono"
              style={{
                backgroundColor: colors.gold,
                color: colors.textDark,
              }}
            >
              {redirecting ? (
                <div className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Redirecting...</span>
                </div>
              ) : (
                'Go to Wallet Now'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state (webhook confirmed)
  if (status === 'succeeded') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: colors.background }}
      >
        <div
          className="max-w-md w-full rounded-lg p-8 text-center space-y-6"
          style={{
            backgroundColor: colors.box,
            border: `1px solid ${colors.boxOutline}`,
          }}
        >
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${colors.green}33` }}
            >
              <CheckCircle className="w-10 h-10" style={{ color: colors.green }} />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-mono" style={{ color: colors.textPrimary }}>
              {getTitle()}
            </h1>
            <p className="text-sm font-mono" style={{ color: colors.textSecondary }}>
              {isDeposit
                ? 'Your deposit has been processed successfully. Funds are now available in your wallet.'
                : 'Your withdrawal has been processed successfully. Funds will be transferred to your account.'}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-mono" style={{ color: colors.textSecondary }}>
              Redirecting to wallet in{' '}
              <span className="font-bold" style={{ color: colors.green }}>
                {countdown}
              </span>{' '}
              seconds...
            </p>

            <Button
              onClick={handleRedirect}
              disabled={redirecting}
              className="w-full font-mono"
              style={{
                backgroundColor: colors.green,
                color: colors.textDark,
              }}
            >
              {redirecting ? (
                <div className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Redirecting...</span>
                </div>
              ) : (
                'Go to Wallet Now'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error states
  if (
    status === 'failed' ||
    status === 'terminally_failed' ||
    status === 'expired' ||
    status === 'returned' ||
    status === 'not_completed'
  ) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: colors.background }}
      >
        <div
          className="max-w-md w-full rounded-lg p-8 text-center space-y-6"
          style={{
            backgroundColor: colors.box,
            border: `1px solid ${colors.boxOutline}`,
          }}
        >
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${colors.red}33` }}
            >
              <XCircle className="w-10 h-10" style={{ color: colors.red }} />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-mono" style={{ color: colors.textPrimary }}>
              {getTitle()}
            </h1>
            <p className="text-sm font-mono" style={{ color: colors.textSecondary }}>
              {message || getErrorMessage(status)}
            </p>
          </div>

          <Button
            onClick={handleRedirect}
            disabled={redirecting}
            className="w-full font-mono"
            style={{
              backgroundColor: colors.green,
              color: colors.textDark,
            }}
          >
            {redirecting ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Redirecting...</span>
              </div>
            ) : (
              'Go to Wallet'
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Verifying/Pending state
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: colors.background }}
    >
      <div
        className="max-w-md w-full rounded-lg p-8 text-center space-y-6"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        <div className="flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold font-mono" style={{ color: colors.textPrimary }}>
            Verifying Payment Status
          </h1>
          <p className="text-sm font-mono" style={{ color: colors.textSecondary }}>
            Please wait while we verify your payment...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{ backgroundColor: colors.background }}
        >
          <div
            className="max-w-md w-full rounded-lg p-8 text-center"
            style={{
              backgroundColor: colors.box,
              border: `1px solid ${colors.boxOutline}`,
            }}
          >
            <LoadingSpinner size="lg" />
          </div>
        </div>
      }
    >
      <PaymentSuccessPageContent />
    </Suspense>
  );
}
