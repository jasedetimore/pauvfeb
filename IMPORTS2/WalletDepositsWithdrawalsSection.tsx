'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, Ban } from 'lucide-react';
import { WalletDepositsWithdrawalsSkeleton } from '@/components/atoms/skeleton';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { PaymentNotification } from '@/components/atoms/payment-notification';
import { getWalletTransactions, WalletTransactionRow } from '@/services/wallet-api';
import { initiateDeposit, initiateWithdrawal, getPaymentTransactions } from '@/services/payment-api';
import { PaymentTransaction, PaginationMeta } from '@/types/payment';
import { getPendingAmount, getPendingType, clearCheckoutState } from '@/utils/payment-storage';
import { useMyWalletBalance } from '@/hooks/use-wallet-balance';
import { usePaymentWebSocket } from '@/hooks/use-payment-websocket';
import { PaymentUpdateEvent } from '@/types/payment';

interface Transfer {
  id: string;
  date: string;
  type: 'Deposit' | 'Withdrawal';
  amount: number;
  usdpChange: number;
  balance: number | null; // null for failed payments
  txid: string;
  status: string;
  failure_reason?: string | null;
  source: 'wallet' | 'payment'; // Track which endpoint the data came from
  checkout_id?: string; // For payment transactions
}

export default function WalletDepositsWithdrawalsSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notificationEvent, setNotificationEvent] = useState<PaymentUpdateEvent | null>(null);
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useMyWalletBalance();

  // Pagination state
  const TRANSACTIONS_PER_PAGE = 20;
  const [allLoadedTransfers, setAllLoadedTransfers] = useState<Transfer[]>([]); // All merged transactions loaded from API
  const [currentDisplayCount, setCurrentDisplayCount] = useState(TRANSACTIONS_PER_PAGE); // How many to display
  const [lastFetchedPage, setLastFetchedPage] = useState(1); // Last page fetched from API
  const [pagination, setPagination] = useState<PaginationMeta>({
    limit: TRANSACTIONS_PER_PAGE,
    offset: 0,
    page: 1,
    total: 0,
    has_more: false,
    has_next: false,
    has_prev: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);

  const usdpBalance = wallet ? parseFloat(String(wallet.balance)) : 0;
  const lastProcessedEventRef = useRef<string | null>(null);
  const refreshedCheckoutIdsRef = useRef<Set<string>>(new Set());

  // Get failure message for user-friendly display
  const getFailureMessage = useCallback((reason: string | null | undefined): string => {
    if (!reason) return '';
    const messages: Record<string, string> = {
      'compliance_check_failed': 'Compliance check failed (KYC, location, or fraud detection)',
      'checkout_expired': 'Checkout session expired',
      'payment_failed': 'Payment failed',
    };
    return messages[reason] || 'Payment failed';
  }, []);

  const loadTransfers = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setAllLoadedTransfers([]);
        setCurrentDisplayCount(TRANSACTIONS_PER_PAGE);
        setLastFetchedPage(1);
      } else {
        setLoadingMore(true);
      }
      setError('');
      
      // Calculate if we need to fetch more pages
      // We need at least (currentDisplayCount + TRANSACTIONS_PER_PAGE) transactions loaded
      const neededCount = reset ? TRANSACTIONS_PER_PAGE : currentDisplayCount + TRANSACTIONS_PER_PAGE;
      const pagesNeeded = Math.ceil(neededCount / TRANSACTIONS_PER_PAGE);
      const pagesToFetch = reset ? pagesNeeded : Math.max(0, pagesNeeded - lastFetchedPage);
      
      if (pagesToFetch <= 0 && !reset) {
        // We already have enough loaded, just update display count
        setCurrentDisplayCount(prev => prev + TRANSACTIONS_PER_PAGE);
        setLoadingMore(false);
        return;
      }
      
      // Fetch additional pages if needed
      const fetchPromises = [];
      const startPage = reset ? 1 : lastFetchedPage + 1;
      const endPage = reset ? pagesNeeded : lastFetchedPage + pagesToFetch;
      
      for (let p = startPage; p <= endPage; p++) {
        fetchPromises.push(
          Promise.all([
            getWalletTransactions({ limit: TRANSACTIONS_PER_PAGE, page: p }),
            getPaymentTransactions({ limit: TRANSACTIONS_PER_PAGE, page: p, status: 'failed,expired,terminally_failed' }),
          ])
        );
      }
      
      const responses = await Promise.all(fetchPromises);
      
      const newTransfers: Transfer[] = [];
      let walletHasMore = false;
      let paymentHasMore = false;
      let walletTotal = 0;
      let paymentTotal = 0;
      
      // Process all fetched pages
      for (const [walletResponse, paymentResponse] of responses) {
        // Process wallet transactions (successful balance changes)
        if (walletResponse.success && walletResponse.data?.transactions) {
          const walletTransfers: Transfer[] = walletResponse.data.transactions.map((tx: WalletTransactionRow) => {
            const balanceAfter = tx.balance_after ? parseFloat(tx.balance_after) : 0;
            const amount = parseFloat(tx.amount) || 0;
            
            return {
              id: tx.id,
              date: tx.created_at,
              type: tx.transaction_type === 'deposit' ? 'Deposit' : 'Withdrawal',
              amount: amount,
              usdpChange: tx.transaction_type === 'deposit' 
                ? amount 
                : -amount,
              balance: isNaN(balanceAfter) ? 0 : balanceAfter,
              txid: tx.id,
              status: 'Completed',
              failure_reason: null,
              source: 'wallet',
            };
          });
          newTransfers.push(...walletTransfers);
          
          // Track pagination info from last response
          if (walletResponse.data?.pagination) {
            walletHasMore = walletResponse.data.pagination.has_more || false;
            walletTotal = walletResponse.data.pagination.total || 0;
          }
        }
        
        // Process payment transactions (failed/expired/terminally_failed)
        if (paymentResponse.success && paymentResponse.data?.transactions) {
          const paymentTransfers: Transfer[] = paymentResponse.data.transactions
            .filter(tx => ['failed', 'expired', 'terminally_failed'].includes(tx.status))
            .map((tx: PaymentTransaction) => {
              const amount = tx.amount_cents / 100;
              const isDeposit = tx.type === 'deposit';
              
              return {
                id: tx.id,
                date: tx.created_at,
                type: isDeposit ? 'Deposit' : 'Withdrawal',
                amount: amount,
                usdpChange: isDeposit ? amount : -amount,
                balance: null, // Failed payments don't change balance
                txid: tx.checkout_id || tx.id,
                status: tx.status === 'failed' ? 'Failed' : 
                       tx.status === 'expired' ? 'Expired' : 
                       tx.status === 'terminally_failed' ? 'Blocked' : tx.status,
                failure_reason: tx.failure_reason,
                source: 'payment',
                checkout_id: tx.checkout_id,
              };
            });
          newTransfers.push(...paymentTransfers);
          
          // Track pagination info from last response
          if (paymentResponse.data?.pagination) {
            paymentHasMore = paymentResponse.data.pagination.has_more || false;
            paymentTotal = paymentResponse.data.pagination.total || 0;
          }
        }
      }
      
      // Merge with existing transfers, deduplicate, and sort
      const merged = reset 
        ? newTransfers
        : [...allLoadedTransfers, ...newTransfers];
      
      const deduplicated = merged.filter((transfer, index, self) => 
        index === self.findIndex(t => t.id === transfer.id && t.source === transfer.source)
      );
      
      const sortedTransfers = deduplicated.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setAllLoadedTransfers(sortedTransfers);
      setLastFetchedPage(reset ? pagesToFetch : lastFetchedPage + pagesToFetch);
      
      // Update display count
      if (reset) {
        setCurrentDisplayCount(TRANSACTIONS_PER_PAGE);
      } else {
        setCurrentDisplayCount(prev => prev + TRANSACTIONS_PER_PAGE);
      }
      
      // Update pagination
      const combinedTotal = walletTotal + paymentTotal;
      const hasMore = sortedTransfers.length > currentDisplayCount + TRANSACTIONS_PER_PAGE || walletHasMore || paymentHasMore;
      
      setPagination({
        limit: TRANSACTIONS_PER_PAGE,
        offset: 0,
        page: Math.ceil(currentDisplayCount / TRANSACTIONS_PER_PAGE),
        total_pages: Math.ceil(sortedTransfers.length / TRANSACTIONS_PER_PAGE),
        total: combinedTotal,
        has_more: hasMore,
        has_next: hasMore,
        has_prev: false,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load transfers');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [getFailureMessage, allLoadedTransfers, currentDisplayCount, lastFetchedPage]);

  // Calculate displayed transfers - exactly 20 per page (or currentDisplayCount)
  const transfers = useMemo(() => {
    return allLoadedTransfers.slice(0, currentDisplayCount);
  }, [allLoadedTransfers, currentDisplayCount]);

  const loadMore = useCallback(() => {
    if (pagination.has_more && !loadingMore && !loading) {
      loadTransfers(false);
    }
  }, [pagination, loadingMore, loading, loadTransfers]);

  // Consolidate success refresh logic
  const handleSuccessRefresh = useCallback((checkoutId: string, balanceAfter?: number) => {
    if (refreshedCheckoutIdsRef.current.has(checkoutId)) {
      return;
    }
    refreshedCheckoutIdsRef.current.add(checkoutId);
    
    // Balance is already updated in onPaymentUpdate handler
    // Only fetch from API as fallback if balance_after was not provided
    if (balanceAfter === undefined) {
      refetchWallet();
    }
    
    // Always refresh transfers to show the new transaction
    loadTransfers(true);
  }, [refetchWallet, loadTransfers]);

  // Connect to payment WebSocket for real-time updates
  usePaymentWebSocket({
    onPaymentUpdate: (event) => {
      const eventId = `${event.checkout_id}-${event.status}`;
      
      if (lastProcessedEventRef.current === eventId) {
        return;
      }

      lastProcessedEventRef.current = eventId;
      setNotificationEvent(event);
      
      // Update balance from WebSocket event if available (for all statuses)
      if (event.balance_after !== undefined && typeof event.balance_after === 'number') {
        queryClient.setQueryData(['my-wallet-balance'], { balance: event.balance_after });
      }
      
      if (event.status === 'succeeded') {
        clearCheckoutState();
        handleSuccessRefresh(event.checkout_id, event.balance_after);
      } else if (
        event.status === 'failed' ||
        event.status === 'terminally_failed' ||
        event.status === 'expired'
      ) {
        clearCheckoutState();
        setAmount('');
      }
    },
  });

  // Restore pending payment on mount or from URL params
  useEffect(() => {
    // Check URL params first (from failed payment retry)
    const urlType = searchParams.get('type') as 'deposit' | 'withdraw' | null;
    const urlAmount = searchParams.get('amount');
    
    if (urlType && urlAmount) {
      setAction(urlType === 'deposit' ? 'deposit' : 'withdraw');
      setAmount(urlAmount);
      // Clear URL params
      router.replace('/profile/wallet?section=deposits-withdrawals', { scroll: false });
    } else {
      // Check sessionStorage for pending payment
      const pendingAmount = getPendingAmount();
      const pendingType = getPendingType();
      
      if (pendingAmount && pendingType) {
        setAmount(pendingAmount);
        setAction(pendingType === 'deposit' ? 'deposit' : 'withdraw');
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    loadTransfers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!wallet) {
      setError('Wallet not loaded. Please refresh the page.');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      
      const depositAmount = parseFloat(amount);
      
      // Initiate payment with Soap
      const response = await initiateDeposit(depositAmount);
      
      if (response.success && response.data?.checkout_url) {
        // Redirect to Soap checkout
        window.location.href = response.data.checkout_url;
        // Note: Code execution stops here due to redirect
      } else {
        throw new Error(response.message || 'Failed to initiate deposit');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Deposit failed';
      setError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount > usdpBalance) {
      setError(`Insufficient balance. Available: ${formatCurrency(usdpBalance)}`);
      return;
    }

    if (!wallet) {
      setError('Wallet not loaded. Please refresh the page.');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      
      // Initiate withdrawal with Soap
      const response = await initiateWithdrawal(withdrawAmount);
      
      if (response.success && response.data?.checkout_url) {
        // Redirect to Soap checkout
        window.location.href = response.data.checkout_url;
        // Note: Code execution stops here due to redirect
      } else {
        throw new Error(response.message || 'Failed to initiate withdrawal');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Withdrawal failed';
      setError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return { date: dateStr, time: timeStr };
  };


  if (loading || walletLoading) {
    return <WalletDepositsWithdrawalsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Payment Notification */}
      <PaymentNotification
        event={notificationEvent}
        onDismiss={() => setNotificationEvent(null)}
      />
      
      {/* Header */}
      <div className="flex items-start justify-between">
      <div>
          <h1 className="text-3xl font-bold text-canvas-foreground font-mono mb-2">
          Deposits & Withdrawals
          </h1>
        <p className="text-canvas-foreground/60 font-mono">
            Manage your $ deposits and withdrawals
          </p>
        </div>
        <Button onClick={() => loadTransfers(true)} className="font-mono" disabled={loading}>
          {loading ? 'Loading...' : '↻ Refresh'}
        </Button>
      </div>


      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded font-mono">
          {error}
        </div>
      )}

      {/* Current Balance */}
      <div className="bg-box-bg border border-box-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm uppercase tracking-wide text-canvas-foreground/60 font-mono mb-2">
              USD Balance
            </div>
            <div className="text-4xl font-bold text-canvas-foreground tabular-nums font-mono">
              {formatCurrency(usdpBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* Deposit/Withdrawal Form */}
      <div className="bg-box-bg border border-box-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-canvas-foreground font-mono mb-4">
          {action === 'deposit' ? 'Deposit $' : 'Withdraw $'}
        </h2>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Action Buttons and Form */}
          <div className="space-y-4">
            <div className="flex gap-2">
          <Button
                onClick={() => setAction('deposit')}
                className={`flex-1 font-mono ${
              action === 'deposit' 
                ? 'bg-[#6ee7b7] text-black' 
                    : 'bg-box-bg text-canvas-foreground hover:bg-box-bg/80'
            }`}
          >
            Deposit
          </Button>
          <Button
                onClick={() => setAction('withdraw')}
                className={`flex-1 font-mono ${
              action === 'withdraw' 
                ? 'bg-[#EF4444] text-white' 
                    : 'bg-box-bg text-canvas-foreground hover:bg-box-bg/80'
            }`}
          >
                Withdrawal
          </Button>
        </div>

            <div className="space-y-3">
          <div>
                <label className="block text-sm font-medium text-canvas-foreground/60 font-mono mb-1">
                  Amount ($)
            </label>
            <Input
                  type="number"
              value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="font-mono"
                />
              </div>
              <Button
                onClick={action === 'deposit' ? handleDeposit : handleWithdraw}
                disabled={actionLoading || !amount}
                className={`w-full font-mono ${
                  action === 'deposit'
                    ? 'bg-[#6ee7b7] hover:bg-[#6ee7b7]/80 text-black'
                    : 'bg-[#EF4444] hover:bg-[#EF4444]/90'
                } text-white`}
              >
                {actionLoading ? 'Processing...' : action === 'deposit' ? 'Deposit' : 'Withdraw'}
              </Button>
            </div>
          </div>

          {/* Info Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-box-bg border border-box-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-canvas-foreground font-mono mb-2">
                  {action === 'deposit' ? 'Deposit Information' : 'Withdrawal Information'}
              </h3>
              <div className="text-sm text-canvas-foreground/80 font-mono space-y-1">
                  {action === 'deposit' ? (
                    <>
                    <p>• Deposits are processed instantly</p>
                    <p>• No fees for deposits</p>
                    <p>• Funds are available immediately for trading</p>
                    </>
                  ) : (
                    <>
                    <p>• Withdrawals may take 1-3 business days</p>
                    <p>• Minimum withdrawal: $10.00</p>
                    <p>• Withdrawal fee: $0.00</p>
                    </>
                  )}
              </div>
            </div>

            {action === 'withdraw' && (
              <div className="bg-box-bg border border-box-border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-canvas-foreground font-mono mb-2">
                  Withdrawal Limits
                </h3>
                <div className="text-sm text-canvas-foreground/80 font-mono space-y-1">
                  <p>• Daily limit: $10,000</p>
                  <p>• Monthly limit: $100,000</p>
                  <p>• Available balance: {formatCurrency(usdpBalance)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transfers History */}
      <div className="bg-box-bg border border-box-border rounded-lg overflow-hidden">
        <div className="p-6 border-b border-box-border">
          <h2 className="text-lg font-semibold text-canvas-foreground font-mono">
            Transfer History
          </h2>
        </div>
        
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-box-bg/50 border-b border-box-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-canvas-foreground/60 uppercase tracking-wider font-mono">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-canvas-foreground/60 uppercase tracking-wider font-mono">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-canvas-foreground/60 uppercase tracking-wider font-mono">
                   Amount $
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-canvas-foreground/60 uppercase tracking-wider font-mono">
                    Balance After
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-canvas-foreground/60 uppercase tracking-wider font-mono">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-canvas-foreground/60 uppercase tracking-wider font-mono">
                    Transaction ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-box-border">
              {transfers.map((transfer) => {
                const dateTime = formatDate(transfer.date);
                const isCompleted = transfer.status === 'Completed';
                const isFailed = ['Failed', 'Expired', 'Blocked'].includes(transfer.status);
                const isDeposit = transfer.type === 'Deposit';
                const hasFailureReason = transfer.failure_reason && transfer.source === 'payment';
                
                // Get status badge with icon component
                const getStatusBadge = () => {
                  if (isCompleted) {
                    return { 
                      Icon: CheckCircle, 
                      color: 'text-green-400 bg-green-500/10',
                      size: 16
                    };
                  } else if (transfer.status === 'Failed') {
                    return { 
                      Icon: XCircle, 
                      color: 'text-red-400 bg-red-500/10',
                      size: 16
                    };
                  } else if (transfer.status === 'Expired') {
                    return { 
                      Icon: Clock, 
                      color: 'text-orange-400 bg-orange-500/10',
                      size: 16
                    };
                  } else if (transfer.status === 'Blocked') {
                    return { 
                      Icon: Ban, 
                      color: 'text-red-400 bg-red-500/10',
                      size: 16
                    };
                  }
                  return { 
                    Icon: XCircle, 
                    color: 'text-red-400 bg-red-500/10',
                    size: 16
                  };
                };
                
                const statusBadge = getStatusBadge();
                const StatusIcon = statusBadge.Icon;
                
                return (
                  <tr key={`${transfer.source}-${transfer.id}`} className="hover:bg-box-bg/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs text-canvas-foreground font-mono">
                          {dateTime.date}
                        </span>
                        <span className="text-xs text-canvas-foreground/50 font-mono">
                          {dateTime.time}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-md font-mono transition-colors ${
                        isDeposit
                          ? 'text-green-400 bg-green-500/10 border border-green-500/20' 
                          : 'text-red-400 bg-red-500/10 border border-red-500/20'
                      }`}>
                        {transfer.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-semibold font-mono tabular-nums ${
                        transfer.usdpChange >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transfer.usdpChange >= 0 ? '+' : ''}{formatCurrency(transfer.usdpChange)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-canvas-foreground font-mono tabular-nums">
                        {transfer.balance !== null && !isNaN(transfer.balance) 
                          ? formatCurrency(transfer.balance) 
                          : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${statusBadge.color}`}>
                          <StatusIcon className="w-4 h-4" />
                        </span>
                        {hasFailureReason && (
                          <span className="text-xs text-canvas-foreground/60 font-mono max-w-[120px] text-center truncate" title={getFailureMessage(transfer.failure_reason)}>
                            {getFailureMessage(transfer.failure_reason)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-canvas-foreground/60 font-mono font-medium">
                        {transfer.txid}
                      </span>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
          
          {/* Load More Button */}
          {transfers.length > 0 && pagination.has_more && (
            <div className="p-6 border-t border-box-border flex justify-center">
              <Button 
                onClick={loadMore}                  disabled={loadingMore}
                  className="w-full py-2 px-4 bg-[#E5C68D] hover:bg-[#E5C68D]/80 text-black font-semibold font-mono rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
      </div>

      {transfers.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-canvas-foreground/60 font-mono">
            No transfers found.
            </p>
          </div>
        )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-box-bg border border-box-border rounded-lg p-4">
          <div className="text-xs uppercase tracking-wide opacity-60 font-mono mb-1">
            Total Deposits
          </div>
          <div className="text-lg font-semibold tabular-nums font-mono text-green-600">
            {formatCurrency(transfers.filter(t => t.type === 'Deposit').reduce((sum, t) => sum + t.amount, 0))}
          </div>
        </div>
        <div className="bg-box-bg border border-box-border rounded-lg p-4">
          <div className="text-xs uppercase tracking-wide opacity-60 font-mono mb-1">
            Total Withdrawals
          </div>
          <div className="text-lg font-semibold tabular-nums font-mono text-red-600">
            {formatCurrency(transfers.filter(t => t.type === 'Withdrawal').reduce((sum, t) => sum + t.amount, 0))}
          </div>
        </div>
        <div className="bg-box-bg border border-box-border rounded-lg p-4">
          <div className="text-xs uppercase tracking-wide opacity-60 font-mono mb-1">
            Net Flow
          </div>
          <div className={`text-lg font-semibold tabular-nums font-mono ${
            transfers.reduce((sum, t) => sum + t.usdpChange, 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {transfers.reduce((sum, t) => sum + t.usdpChange, 0) >= 0 ? '+' : ''}
            {formatCurrency(transfers.reduce((sum, t) => sum + t.usdpChange, 0))}
          </div>
        </div>
      </div>
    </div>
  );
}
