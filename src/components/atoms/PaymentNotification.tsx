'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { PaymentUpdateEvent } from '@/lib/types/payment';
import { colors } from '@/lib/constants/colors';

interface PaymentNotificationProps {
  event: PaymentUpdateEvent | null;
  onDismiss?: () => void;
  duration?: number;
}

export function PaymentNotification({
  event,
  onDismiss,
  duration,
}: PaymentNotificationProps) {
  const defaultDuration = event?.status === 'succeeded' ? 8000 : 5000;
  const finalDuration = duration ?? defaultDuration;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (event) {
      setVisible(true);

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

  const getNotificationStyle = () => {
    switch (event.status) {
      case 'succeeded':
        return {
          bg: colors.green,
          icon: '✅',
        };
      case 'failed':
      case 'terminally_failed':
        return {
          bg: colors.red,
          icon: '❌',
        };
      case 'held':
        return {
          bg: '#EAB308', // yellow
          icon: '⏳',
        };
      case 'pending':
        return {
          bg: '#3B82F6', // blue
          icon: '🔄',
        };
      case 'expired':
        return {
          bg: colors.textSecondary,
          icon: '⏰',
        };
      default:
        return {
          bg: colors.box,
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
      return `$${amount} ${typeLabel.toLowerCase()} is being processed`;
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
      className={`fixed top-4 right-4 z-50 min-w-[320px] max-w-md border rounded-lg p-4 shadow-lg font-mono transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        backgroundColor: `${style.bg}1a`, // 10% opacity hex
        borderColor: `${style.bg}4d`, // 30% opacity hex
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-2xl" style={{ color: style.bg }}>
            {style.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4
              className="font-semibold text-sm mb-1"
              style={{ color: style.bg }}
            >
              {getStatusMessage()}
            </h4>
            <p className="text-xs" style={{ color: `${colors.textPrimary}cc` }}>
              {getDetailsMessage()}
            </p>
            {event.checkout_id && (
              <p className="text-xs mt-1" style={{ color: `${colors.textPrimary}66` }}>
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
          variant="ghost"
          size="sm"
          className="p-1 h-6 w-6"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
