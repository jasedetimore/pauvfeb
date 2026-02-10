'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/atoms/button';
import { getPendingAmount, getPendingType, clearCheckoutState, getCheckoutState } from '@/utils/payment-storage';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { XCircle } from 'lucide-react';

function PaymentFailedPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get('checkout_id');
  const errorParam = searchParams.get('error');
  const messageParam = searchParams.get('message');
  
  const [pendingAmount, setPendingAmount] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<'deposit' | 'withdrawal' | null>(null);

  useEffect(() => {
    // Get pending payment info for retry
    const amount = getPendingAmount();
    const type = getPendingType();
    
    setPendingAmount(amount);
    setPendingType(type);
    
    // Clear checkout state (payment failed)
    if (checkoutId) {
      clearCheckoutState();
    }
  }, [checkoutId]);

  function handleRetry() {
    if (pendingType && pendingAmount) {
      router.push(`/profile/wallet?section=deposits-withdrawals&type=${pendingType}&amount=${pendingAmount}`);
    } else {
      router.push('/profile/wallet?section=deposits-withdrawals');
    }
  }

  function handleBackToWallet() {
    router.push('/profile/wallet?section=deposits-withdrawals');
  }

  function getErrorMessage(): string {
    if (messageParam) {
      return messageParam;
    }
    
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'payment_failed': 'Payment processing failed. Please try again.',
        'payment_declined': 'Your payment was declined. Please check your payment method.',
        'insufficient_funds': 'Insufficient funds. Please check your account balance.',
        'expired': 'Payment session expired. Please initiate a new payment.',
        'cancelled': 'Payment was not completed. If you closed the payment page or did not complete the transaction, please try again.',
        'failed': 'Payment processing failed. The transaction was not completed. Please try again.',
        'terminally_failed': 'Payment processing failed permanently. Please try again or contact support.',
      };
      
      return errorMessages[errorParam] || 'Payment failed. Please try again.';
    }
    
    return 'Payment failed. Please try again.';
  }
  
  function getErrorTitle(): string {
    const errorParam = searchParams.get('error');
    const urlType = searchParams.get('type') as 'deposit' | 'withdrawal' | null;
    const storageType = getPendingType();
    const checkoutState = getCheckoutState();
    const type = urlType || checkoutState?.type || storageType;
    const isDeposit = type === 'deposit';
    const isWithdrawal = type === 'withdrawal';
    
    if (errorParam === 'cancelled') {
      return isDeposit ? 'Deposit Not Completed' : isWithdrawal ? 'Withdrawal Not Completed' : 'Payment Not Completed';
    }
    
    return isDeposit ? 'Deposit Failed' : isWithdrawal ? 'Withdrawal Failed' : 'Payment Failed';
  }

  return (
    <div className="min-h-screen bg-canvas-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-box-bg border border-box-border rounded-lg p-8 text-center space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-canvas-foreground font-mono">
            {getErrorTitle()}
          </h1>
          <p className="text-canvas-foreground/60 font-mono text-sm">
            {getErrorMessage()}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {pendingAmount && pendingType && (
            <Button
              onClick={handleRetry}
              className="w-full bg-[#6ee7b7] hover:bg-[#6ee7b7]/80 text-black font-mono"
            >
              Retry {pendingType === 'deposit' ? 'Deposit' : 'Withdrawal'}
            </Button>
          )}
          
          <Button
            onClick={handleBackToWallet}
            className="w-full bg-box-bg hover:bg-box-bg/80 text-canvas-foreground border border-box-border font-mono"
          >
            Back to Wallet
          </Button>
        </div>

        {/* Support Info */}
        <div className="pt-4 border-t border-box-border">
          <p className="text-xs text-canvas-foreground/40 font-mono">
            If this problem persists, please contact support
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-canvas-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-box-bg border border-box-border rounded-lg p-8 text-center">
          <LoadingSpinner />
        </div>
      </div>
    }>
      <PaymentFailedPageContent />
    </Suspense>
  );
}
