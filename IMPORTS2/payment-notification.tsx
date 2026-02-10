'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';
import { PaymentUpdateEvent } from '@/types/payment';

interface PaymentNotificationProps {
  event: PaymentUpdateEvent | null;
  onDismiss?: () => void;
  duration?: number; // Auto-dismiss duration in ms
}

export function PaymentNotification({ 
  event, 
  onDismiss,
  duration 
}: PaymentNotificationProps) {
  const defaultDuration = event?.status === 'succeeded' ? 8000 : 5000;
  const finalDuration = duration ?? defaultDuration;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (event) {
      setVisible(true);
      
      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          onDismiss?.();
        }, 300);
      }, finalDuration);

      return () => clearTimeout(timer);
    }
  }, [event, finalDuration, onDismiss]);

  if (!event || !visible) return null;

  const amount = (event.amount_cents / 100).toFixed(2);
  const typeLabel = event.type === 'deposit' ? 'Deposit' : 'Withdrawal';

  // Determine notification style based on status
  const getNotificationStyle = () => {
    switch (event.status) {
      case 'succeeded':
        return {
          bg: 'bg-[#6ee7b7]/10',
          border: 'border-[#6ee7b7]/30',
          text: 'text-[#6ee7b7]',
          icon: '✅',
        };
      case 'failed':
      case 'terminally_failed':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-400',
          icon: '❌',
        };
      case 'held':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          text: 'text-yellow-400',
          icon: '⏳',
        };
      case 'pending':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          icon: '🔄',
        };
      case 'expired':
        return {
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/30',
          text: 'text-gray-400',
          icon: '⏰',
        };
      default:
        return {
          bg: 'bg-box-bg',
          border: 'border-box-border',
          text: 'text-canvas-foreground',
          icon: 'ℹ️',
        };
    }
  };

  const style = getNotificationStyle();

  const getStatusMessage = () => {
    switch (event.status) {
      case 'succeeded':
        return `${typeLabel} Successful`;
      case 'failed':
        return `${typeLabel} Failed`;
      case 'terminally_failed':
        return 'Payment Blocked';
      case 'held':
        return 'Withdrawal Processing';
      case 'pending':
        return 'Payment Processing';
      case 'expired':
        return 'Payment Expired';
      default:
        return 'Payment Update';
    }
  };

  const getDetailsMessage = () => {
    if (event.message) {
      return event.message;
    }
    
    if (event.status === 'succeeded') {
      return `$${amount} ${event.type === 'deposit' ? 'deposited' : 'withdrawn'} successfully`;
    }
    
    if (event.status === 'failed' || event.status === 'terminally_failed') {
      return 'Payment could not be processed';
    }
    
    if (event.status === 'pending') {
      return `$${amount} ${typeLabel.toLowerCase()} is being processed (geo check, KYC verification, etc.)`;
    }
    
    if (event.status === 'held') {
      return `$${amount} withdrawal is being processed (compliance review)`;
    }
    
    if (event.status === 'expired') {
      return 'Payment session expired. Please initiate a new payment.';
    }
    
    return `$${amount} ${typeLabel.toLowerCase()} is being processed`;
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 min-w-[320px] max-w-md ${style.bg} ${style.border} border rounded-lg p-4 shadow-lg font-mono transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`text-2xl ${style.text}`}>
            {style.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold ${style.text} text-sm mb-1`}>
              {getStatusMessage()}
            </h4>
            <p className="text-canvas-foreground/80 text-xs">
              {getDetailsMessage()}
            </p>
            {event.checkout_id && (
              <p className="text-canvas-foreground/40 text-xs mt-1">
                ID: {event.checkout_id.substring(0, 12)}...
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={() => {
            setVisible(false);
            setTimeout(() => {
              onDismiss?.();
            }, 300);
          }}
          className="p-1 h-6 w-6 bg-transparent hover:bg-box-bg/50 text-canvas-foreground/60 hover:text-canvas-foreground border-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

