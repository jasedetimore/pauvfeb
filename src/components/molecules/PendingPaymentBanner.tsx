'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/atoms/Button';
import { getCheckoutState, clearCheckoutState } from '@/lib/utils/payment-storage';
import { checkPaymentStatus } from '@/lib/services/payment-api';
import { usePaymentWebSocket } from '@/lib/hooks/usePaymentWebSocket';
import { PendingPaymentState } from '@/lib/types/payment';
import { colors } from '@/lib/constants/colors';

interface PendingPaymentBannerProps {
  onStatusChange?: (status: 'completed' | 'failed' | 'cleared') => void;
}

export function PendingPaymentBanner({ onStatusChange }: PendingPaymentBannerProps) {
  const [pendingPayment, setPendingPayment] = useState<PendingPaymentState | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentError, setPaymentError] = useState<'failed' | 'cancelled' | null>(null);
  const [errorPaymentType, setErrorPaymentType] = useState<'deposit' | 'withdrawal' | null>(null);

  useEffect(() => {
    const state = getCheckoutState();
    if (state) {
      setPendingPayment(state);

      const checkStatus = async () => {
        try {
          const response = await checkPaymentStatus(state.checkout_id);

          if (response.success && response.data) {
            if (response.data.status === 'succeeded') {
              clearCheckoutState();
              setPendingPayment(null);
              onStatusChange?.('completed');
            } else if (
              response.data.status === 'failed' ||
              response.data.status === 'terminally_failed' ||
              response.data.status === 'expired'
            ) {
              setErrorPaymentType(state.type);
              setPaymentError('failed');
              clearCheckoutState();
              setPendingPayment(null);
              onStatusChange?.('failed');
            }
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : '';
          if (message.includes('not found')) {
            const elapsed = Date.now() - state.timestamp;
            if (elapsed > 2 * 60 * 1000) {
              setErrorPaymentType(state.type);
              setPaymentError('cancelled');
              clearCheckoutState();
              setPendingPayment(null);
              onStatusChange?.('failed');
            }
          }
        }
      };

      checkStatus();

      const intervalId = setInterval(() => {
        const currentState = getCheckoutState();
        if (currentState && currentState.checkout_id === state.checkout_id) {
          const elapsed = Date.now() - currentState.timestamp;
          if (elapsed > 2 * 60 * 1000) {
            checkStatus();
          }
        } else {
          clearInterval(intervalId);
        }
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [onStatusChange]);

  const { isConnected } = usePaymentWebSocket({
    enabled: !!pendingPayment && !paymentError,
    onPaymentUpdate: (event) => {
      if (event.checkout_id === pendingPayment?.checkout_id) {
        if (event.status === 'succeeded') {
          clearCheckoutState();
          setPendingPayment(null);
          setPaymentError(null);
          onStatusChange?.('completed');
        } else if (
          event.status === 'failed' ||
          event.status === 'terminally_failed' ||
          event.status === 'expired'
        ) {
          setErrorPaymentType(event.type);
          setPaymentError('failed');
          clearCheckoutState();
          setPendingPayment(null);
          onStatusChange?.('failed');
        }
      }
    },
    onError: (error) => {
      console.debug('WebSocket error:', error);
    },
  });

  const handleDismiss = () => {
    clearCheckoutState();
    setPendingPayment(null);
    onStatusChange?.('cleared');
  };

  const handleCheckStatus = async () => {
    if (!pendingPayment) return;

    try {
      setCheckingStatus(true);
      const response = await checkPaymentStatus(pendingPayment.checkout_id);

      if (response.success && response.data) {
        const status = response.data.status;

        if (status === 'succeeded') {
          clearCheckoutState();
          setPendingPayment(null);
          setPaymentError(null);
          onStatusChange?.('completed');
        } else if (
          status === 'failed' ||
          status === 'terminally_failed' ||
          status === 'expired'
        ) {
          setErrorPaymentType(pendingPayment.type);
          setPaymentError('failed');
          clearCheckoutState();
          setPendingPayment(null);
          onStatusChange?.('failed');
        } else if (status === 'pending' || status === 'held') {
          const statusMessage =
            status === 'held'
              ? 'Withdrawal is being processed (compliance review)'
              : 'Payment is still being processed';

          alert(`${statusMessage}. You will be notified when it completes.`);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('not found')) {
        const elapsed = Date.now() - pendingPayment.timestamp;
        if (elapsed > 2 * 60 * 1000) {
          setErrorPaymentType(pendingPayment.type);
          setPaymentError('cancelled');
          clearCheckoutState();
          setPendingPayment(null);
          onStatusChange?.('failed');
        } else {
          alert('Payment transaction not found. It may have been completed. Please refresh the page.');
        }
      } else {
        console.error('Failed to check status:', error);
        alert('Unable to check payment status.');
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (!pendingPayment) return null;

  if (paymentError) {
    const currentCheckoutId = pendingPayment.checkout_id;
    const currentType = errorPaymentType || pendingPayment.type;
    clearCheckoutState();
    setPendingPayment(null);
    const errorType = paymentError === 'cancelled' ? 'cancelled' : 'failed';
    window.location.replace(
      `/payment/failed?checkout_id=${currentCheckoutId}&type=${currentType}&error=${errorType}`
    );
    return null;
  }

  const elapsedMinutes = Math.floor((Date.now() - pendingPayment.timestamp) / 60000);

  return (
    <div
      className="rounded-lg p-4 mb-4 border"
      style={{
        backgroundColor: '#EAB30819',
        borderColor: '#EAB3084d',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: '#EAB308' }}
            />
            <h3 className="text-sm font-semibold font-mono" style={{ color: '#EAB308' }}>
              Pending Payment
            </h3>
          </div>
          <p className="text-xs font-mono mb-1" style={{ color: '#EAB308cc' }}>
            {pendingPayment.type === 'deposit' ? 'Deposit' : 'Withdrawal'} of{' '}
            {formatCurrency(pendingPayment.amount)} in progress
          </p>
          {(checkingStatus || (!isConnected && pendingPayment)) && (
            <p className="text-xs font-mono" style={{ color: '#EAB30899' }}>
              {checkingStatus && 'Checking status...'}
              {!checkingStatus && !isConnected && 'WebSocket disconnected, using fallback'}
            </p>
          )}
          {elapsedMinutes > 10 && (
            <p className="text-xs font-mono mt-1" style={{ color: '#EAB30899' }}>
              ⚠️ Payment has been pending for {elapsedMinutes} minutes
            </p>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            onClick={handleCheckStatus}
            size="sm"
            className="text-xs font-mono"
            style={{
              backgroundColor: '#EAB30833',
              color: '#EAB308',
            }}
          >
            Check Status
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="text-xs font-mono"
            style={{ color: '#EAB30899' }}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
