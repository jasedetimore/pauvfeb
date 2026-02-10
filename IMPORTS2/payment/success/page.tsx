'use client';

import { useEffect, useState, Suspense, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';
import { Button } from '@/components/atoms/button';
import { clearCheckoutState, getCheckoutState } from '@/utils/payment-storage';
import { checkPaymentStatus } from '@/services/payment-api';
import { usePaymentWebSocket } from '@/hooks/use-payment-websocket';
import { XCircle, CheckCircle } from 'lucide-react';

const TIMEOUT_MS = 120000; // 2 minutes
const POLL_INTERVAL_MS = 3000; // 3 seconds
const MAX_POLLS = 5; // 5 polls × 3 seconds = 15 seconds

type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'held' | 'expired' | 'terminally_failed' | 'returned' | 'not_completed' | 'verifying';

function PaymentSuccessPageContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus>('verifying');
  const [redirecting, setRedirecting] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [countdown, setCountdown] = useState(3);
  
  // Get checkout_id from URL first, then fallback to sessionStorage
  // Use state to ensure it's reactive and available when needed
  const [checkoutId, setCheckoutId] = useState<string | null>(() => {
    const urlCheckoutId = searchParams.get('checkout_id');
    if (urlCheckoutId) return urlCheckoutId;
    const checkoutState = getCheckoutState();
    return checkoutState?.checkout_id || null;
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
    window.location.replace('/profile/wallet?section=deposits-withdrawals');
  }, [redirecting]);

  const handlePaymentStatus = useCallback((paymentStatus: PaymentStatus, errorMessage?: string) => {
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
  }, [handleRedirect]);

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
          const errorMsg = getErrorMessage(event.status);
          handlePaymentStatus(event.status, errorMsg);
        } else if ((event.status as string) === 'returned') {
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
        const paymentStatus: string = response.data.status;
        
        if (paymentStatus === 'succeeded') {
          handlePaymentStatus('succeeded');
        } else if (paymentStatus === 'returned') {
          handlePaymentStatus('returned', 'Payment was returned or refunded');
        } else if (
          paymentStatus === 'failed' ||
          paymentStatus === 'terminally_failed' ||
          paymentStatus === 'expired'
        ) {
          const errorMsg = getErrorMessage(paymentStatus);
          handlePaymentStatus(paymentStatus as 'failed' | 'terminally_failed' | 'expired', errorMsg);
        } else if (paymentStatus === 'pending' || paymentStatus === 'held') {
          pollCountRef.current++;
          
          if (pollCountRef.current >= MAX_POLLS) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        }
      }
    } catch (error: any) {
      if (error.response?.status === 404 || (error.message?.includes && error.message.includes('not found'))) {
        pollCountRef.current++;
        
        if (pollCountRef.current >= MAX_POLLS) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } else {
        console.error('Error checking payment status:', error);
      }
    }
  }, [checkoutId, handlePaymentStatus]);

  // Initial check and setup - ensure checkoutId is available
  useEffect(() => {
    // Double-check sessionStorage on mount in case URL params weren't available initially
    if (!checkoutId) {
      const checkoutState = getCheckoutState();
      if (checkoutState?.checkout_id) {
        setCheckoutId(checkoutState.checkout_id);
        if (!type && checkoutState.type) {
          setType(checkoutState.type);
        }
        // Will re-run this effect with new checkoutId
        return;
      }
      
      // Only show error if truly no checkout_id available in URL or sessionStorage
      setStatus('not_completed');
      setMessage('Invalid checkout ID. Please check your payment status in your wallet.');
      return;
    }

    // Initial status check
    pollStatus();

    // Start polling (fallback if WebSocket doesn't update)
    pollIntervalRef.current = setInterval(() => {
      if (pollCountRef.current < MAX_POLLS && !isResolvedRef.current) {
        pollStatus();
      }
    }, POLL_INTERVAL_MS);

    // Timeout after 1 minute
    timeoutTimerRef.current = setTimeout(() => {
      if (!isResolvedRef.current) {
        handlePaymentStatus('not_completed', 'Payment was not completed. If you closed the payment page or did not complete the transaction, please try again.');
      }
    }, TIMEOUT_MS);

    // Cleanup
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
      }
    };
  }, [checkoutId, pollStatus, handlePaymentStatus]);

  // Auto-redirect countdown for success
  useEffect(() => {
    if (status !== 'succeeded' || redirecting) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      handleRedirect();
    }
  }, [status, countdown, redirecting, handleRedirect]);

  const getErrorMessage = (errorStatus: string): string => {
    switch (errorStatus) {
      case 'failed':
        return isDeposit 
          ? 'Your deposit could not be processed. The transaction was not completed. Please try again.'
          : 'Your withdrawal could not be processed. The transaction was not completed. Please try again.';
      case 'terminally_failed':
        return 'Payment processing failed permanently. Please try again or contact support.';
      case 'expired':
        return 'Payment session expired. Please initiate a new payment.';
      default:
        return 'Payment failed. Please try again.';
    }
  };

  const getTitle = (): string => {
    switch (status) {
      case 'succeeded':
        return isDeposit ? 'Deposit Successful' : isWithdrawal ? 'Withdrawal Successful' : 'Payment Successful';
      case 'failed':
        return isDeposit ? 'Deposit Failed' : isWithdrawal ? 'Withdrawal Failed' : 'Payment Failed';
      case 'terminally_failed':
        return 'Payment Blocked';
      case 'expired':
        return 'Payment Expired';
      case 'returned':
        return 'Payment Returned';
      case 'not_completed':
        return isDeposit ? 'Deposit Not Completed' : isWithdrawal ? 'Withdrawal Not Completed' : 'Payment Not Completed';
      default:
        return 'Verifying Payment...';
    }
  };

  // Success state
  if (status === 'succeeded') {
    return (
      <div className="min-h-screen bg-canvas-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-box-bg border border-box-border rounded-lg p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[#6ee7b7]/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-[#6ee7b7]" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-canvas-foreground font-mono">
              {getTitle()}
            </h1>
            <p className="text-canvas-foreground/60 font-mono text-sm">
              {isDeposit 
                ? 'Your deposit has been processed successfully. Funds are now available in your wallet.'
                : 'Your withdrawal has been processed successfully. Funds will be transferred to your account.'}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-canvas-foreground/60 font-mono text-sm">
              Redirecting to wallet in{' '}
              <span className="font-bold text-[#6ee7b7]">{countdown}</span> seconds...
            </p>
            
            <Button
              onClick={handleRedirect}
              disabled={redirecting}
              className="w-full bg-[#6ee7b7] hover:bg-[#6ee7b7]/80 text-black font-mono"
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
      <div className="min-h-screen bg-canvas-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-box-bg border border-box-border rounded-lg p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-canvas-foreground font-mono">
              {getTitle()}
            </h1>
            <p className="text-canvas-foreground/60 font-mono text-sm">
              {message || getErrorMessage(status)}
            </p>
          </div>

          <Button
            onClick={handleRedirect}
            disabled={redirecting}
            className="w-full bg-[#6ee7b7] hover:bg-[#6ee7b7]/80 text-black font-mono"
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
    <div className="min-h-screen bg-canvas-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-box-bg border border-box-border rounded-lg p-8 text-center space-y-6">
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-canvas-foreground font-mono">
            Verifying Payment Status
          </h1>
          <p className="text-canvas-foreground/60 font-mono text-sm">
            Please wait while we verify your payment...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-canvas-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-box-bg border border-box-border rounded-lg p-8 text-center">
          <LoadingSpinner />
        </div>
      </div>
    }>
      <PaymentSuccessPageContent />
    </Suspense>
  );
}
