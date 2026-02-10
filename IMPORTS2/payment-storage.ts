// Payment storage utility functions for sessionStorage

import { PendingPaymentState } from '@/types/payment';

const STORAGE_KEYS = {
  CHECKOUT_STATE: 'soap_checkout_state',
  PENDING_AMOUNT: 'soap_pending_amount',
  PENDING_TYPE: 'soap_pending_type',
} as const;

const CHECKOUT_STATE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Store checkout state in sessionStorage
 */
export function storeCheckoutState(state: PendingPaymentState): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem(STORAGE_KEYS.CHECKOUT_STATE, JSON.stringify(state));
    sessionStorage.setItem(STORAGE_KEYS.PENDING_AMOUNT, state.amount.toString());
    sessionStorage.setItem(STORAGE_KEYS.PENDING_TYPE, state.type);
  } catch (error) {
    console.error('Failed to store checkout state:', error);
  }
}

/**
 * Get checkout state from sessionStorage
 */
export function getCheckoutState(): PendingPaymentState | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.CHECKOUT_STATE);
    if (!stored) return null;
    
    const state: PendingPaymentState = JSON.parse(stored);
    const elapsed = Date.now() - state.timestamp;
    
    // Check if expired
    if (elapsed > CHECKOUT_STATE_EXPIRY_MS) {
      clearCheckoutState();
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Failed to get checkout state:', error);
    return null;
  }
}

/**
 * Clear checkout state from sessionStorage
 */
export function clearCheckoutState(): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem(STORAGE_KEYS.CHECKOUT_STATE);
    sessionStorage.removeItem(STORAGE_KEYS.PENDING_AMOUNT);
    sessionStorage.removeItem(STORAGE_KEYS.PENDING_TYPE);
  } catch (error) {
    console.error('Failed to clear checkout state:', error);
  }
}

/**
 * Get pending payment amount (for restoring in form)
 */
export function getPendingAmount(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return sessionStorage.getItem(STORAGE_KEYS.PENDING_AMOUNT);
  } catch {
    return null;
  }
}

/**
 * Get pending payment type
 */
export function getPendingType(): 'deposit' | 'withdrawal' | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const type = sessionStorage.getItem(STORAGE_KEYS.PENDING_TYPE);
    return type === 'deposit' || type === 'withdrawal' ? type : null;
  } catch {
    return null;
  }
}

/**
 * Check if there is an active pending payment
 */
export function hasPendingPayment(): boolean {
  const state = getCheckoutState();
  return state !== null;
}

