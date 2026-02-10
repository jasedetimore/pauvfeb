'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/atoms/button';
import { getCheckoutState, clearCheckoutState } from '@/utils/payment-storage';
import { checkPaymentStatus } from '@/services/payment-api';
import { usePaymentWebSocket } from '@/hooks/use-payment-websocket';
import { PendingPaymentState } from '@/types/payment';

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
        } catch (error: any) {
          if (error.message?.includes('not found')) {
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
          const statusMessage = status === 'held' 
            ? 'Withdrawal is being processed (compliance review)'
            : 'Payment is still being processed (geo check, KYC verification, etc.)';
          
          alert(`${statusMessage}. WebSocket will notify you when it completes.`);
        }
      }
    } catch (error: any) {
      if (error.message?.includes('not found')) {
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
        alert('Unable to check payment status. WebSocket will notify you when payment completes.');
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
    const currentType = pendingPayment.type;
    clearCheckoutState();
    setPendingPayment(null);
    const errorType = paymentError === 'cancelled' ? 'cancelled' : 'failed';
    window.location.replace(`/payment/failed?checkout_id=${currentCheckoutId}&type=${currentType}&error=${errorType}`);
    return null;
  }

  const elapsedMinutes = Math.floor((Date.now() - pendingPayment.timestamp) / 60000);

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-semibold text-yellow-400 font-mono">
              Pending Payment
            </h3>
          </div>
          <p className="text-xs text-yellow-300/80 font-mono mb-1">
            {pendingPayment.type === 'deposit' ? 'Deposit' : 'Withdrawal'} of{' '}
            {formatCurrency(pendingPayment.amount)} in progress
          </p>
          {(checkingStatus || (!isConnected && pendingPayment)) && (
            <p className="text-xs text-yellow-300/60 font-mono">
              {checkingStatus && 'Checking status...'}
              {!checkingStatus && !isConnected && 'WebSocket disconnected, using fallback'}
            </p>
          )}
          {elapsedMinutes > 10 && (
            <p className="text-xs text-yellow-300/60 font-mono mt-1">
              ⚠️ Payment has been pending for {elapsedMinutes} minutes
            </p>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            onClick={handleCheckStatus}
            className="text-xs px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-mono"
          >
            Check Status
          </Button>
          <Button
            onClick={handleDismiss}
            className="text-xs px-3 py-1 bg-transparent hover:bg-yellow-500/10 text-yellow-300/60 font-mono"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}

