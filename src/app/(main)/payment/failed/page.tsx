'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import {
  getPendingAmount,
  getPendingType,
  clearCheckoutState,
  getCheckoutState,
} from '@/lib/utils/payment-storage';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { XCircle } from 'lucide-react';
import { colors } from '@/lib/constants/colors';

function PaymentFailedPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get('checkout_id');
  const errorParam = searchParams.get('error');
  const messageParam = searchParams.get('message');

  const [pendingAmount, setPendingAmount] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<'deposit' | 'withdrawal' | null>(null);

  useEffect(() => {
    const amount = getPendingAmount();
    const type = getPendingType();

    setPendingAmount(amount);
    setPendingType(type);

    if (checkoutId) {
      clearCheckoutState();
    }
  }, [checkoutId]);

  function handleRetry() {
    if (pendingType && pendingAmount) {
      router.push(
        `/account/deposit?type=${pendingType}&amount=${pendingAmount}`
      );
    } else {
      router.push('/account/deposit');
    }
  }

  function handleBackToWallet() {
    router.push('/account/deposit');
  }

  function getErrorMessage(): string {
    if (messageParam) {
      return messageParam;
    }

    if (errorParam) {
      const errorMessages: Record<string, string> = {
        payment_failed: 'Payment processing failed. Please try again.',
        payment_declined: 'Your payment was declined. Please check your payment method.',
        insufficient_funds: 'Insufficient funds. Please check your account balance.',
        expired: 'Payment session expired. Please initiate a new payment.',
        cancelled:
          'Payment was not completed. If you closed the payment page, please try again.',
        failed: 'Payment processing failed. Please try again.',
        terminally_failed:
          'Payment processing failed permanently. Please contact support.',
      };

      return errorMessages[errorParam] || 'Payment failed. Please try again.';
    }

    return 'Payment failed. Please try again.';
  }

  function getErrorTitle(): string {
    const urlType = searchParams.get('type') as 'deposit' | 'withdrawal' | null;
    const storageType = getPendingType();
    const checkoutState = getCheckoutState();
    const type = urlType || checkoutState?.type || storageType;
    const isDeposit = type === 'deposit';
    const isWithdrawal = type === 'withdrawal';

    if (errorParam === 'cancelled') {
      return isDeposit
        ? 'Deposit Not Completed'
        : isWithdrawal
          ? 'Withdrawal Not Completed'
          : 'Payment Not Completed';
    }

    return isDeposit
      ? 'Deposit Failed'
      : isWithdrawal
        ? 'Withdrawal Failed'
        : 'Payment Failed';
  }

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
        {/* Error Icon */}
        <div className="flex justify-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.red}33` }}
          >
            <XCircle className="w-10 h-10" style={{ color: colors.red }} />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-mono" style={{ color: colors.textPrimary }}>
            {getErrorTitle()}
          </h1>
          <p className="text-sm font-mono" style={{ color: colors.textSecondary }}>
            {getErrorMessage()}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {pendingAmount && pendingType && (
            <Button
              onClick={handleRetry}
              className="w-full font-mono"
              style={{
                backgroundColor: colors.green,
                color: colors.textDark,
              }}
            >
              Retry {pendingType === 'deposit' ? 'Deposit' : 'Withdrawal'}
            </Button>
          )}

          <Button
            onClick={handleBackToWallet}
            variant="outline"
            className="w-full font-mono"
            style={{
              borderColor: colors.boxOutline,
              color: colors.textPrimary,
            }}
          >
            Back to Wallet
          </Button>
        </div>

        {/* Support Info */}
        <div style={{ borderTop: `1px solid ${colors.boxOutline}` }} className="pt-4">
          <p className="text-xs font-mono" style={{ color: colors.textMuted }}>
            If this problem persists, please contact support
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
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
      <PaymentFailedPageContent />
    </Suspense>
  );
}
