'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, Ban } from 'lucide-react';
import { WalletDepositsWithdrawalsSkeleton } from '@/components/atoms/Skeleton';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { PaymentNotification } from '@/components/atoms/PaymentNotification';
import { getWalletTransactions, WalletTransactionRow } from '@/lib/services/wallet-api';
import { initiateDeposit, initiateWithdrawal, getPaymentTransactions } from '@/lib/services/payment-api';
import { PaymentTransaction, PaginationMeta, PaymentUpdateEvent } from '@/lib/types/payment';
import { getPendingAmount, getPendingType, clearCheckoutState } from '@/lib/utils/payment-storage';
import { useMyWalletBalance } from '@/lib/hooks/useWalletBalance';
import { usePaymentWebSocket } from '@/lib/hooks/usePaymentWebSocket';
import { colors } from '@/lib/constants/colors';

interface Transfer {
  id: string;
  date: string;
  type: 'Deposit' | 'Withdrawal';
  amount: number;
  usdpChange: number;
  balance: number | null;
  txid: string;
  status: string;
  failure_reason?: string | null;
  source: 'wallet' | 'payment';
  checkout_id?: string;
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
  const [allLoadedTransfers, setAllLoadedTransfers] = useState<Transfer[]>([]);
  const [currentDisplayCount, setCurrentDisplayCount] = useState(TRANSACTIONS_PER_PAGE);
  const [lastFetchedPage, setLastFetchedPage] = useState(1);
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

  const getFailureMessage = useCallback((reason: string | null | undefined): string => {
    if (!reason) return '';
    const messages: Record<string, string> = {
      compliance_check_failed: 'Compliance check failed',
      checkout_expired: 'Checkout session expired',
      payment_failed: 'Payment failed',
    };
    return messages[reason] || 'Payment failed';
  }, []);

  const loadTransfers = useCallback(
    async (reset = false) => {
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

        const neededCount = reset ? TRANSACTIONS_PER_PAGE : currentDisplayCount + TRANSACTIONS_PER_PAGE;
        const pagesNeeded = Math.ceil(neededCount / TRANSACTIONS_PER_PAGE);
        const pagesToFetch = reset ? pagesNeeded : Math.max(0, pagesNeeded - lastFetchedPage);

        if (pagesToFetch <= 0 && !reset) {
          setCurrentDisplayCount((prev) => prev + TRANSACTIONS_PER_PAGE);
          setLoadingMore(false);
          return;
        }

        const fetchPromises = [];
        const startPage = reset ? 1 : lastFetchedPage + 1;
        const endPage = reset ? pagesNeeded : lastFetchedPage + pagesToFetch;

        for (let p = startPage; p <= endPage; p++) {
          fetchPromises.push(
            Promise.all([
              getWalletTransactions({ limit: TRANSACTIONS_PER_PAGE, page: p }),
              getPaymentTransactions({
                limit: TRANSACTIONS_PER_PAGE,
                page: p,
                status: 'failed,expired,terminally_failed',
              }),
            ])
          );
        }

        const responses = await Promise.all(fetchPromises);

        const newTransfers: Transfer[] = [];
        let walletHasMore = false;
        let paymentHasMore = false;
        let walletTotal = 0;
        let paymentTotal = 0;

        for (const [walletResponse, paymentResponse] of responses) {
          if (walletResponse.success && walletResponse.data?.transactions) {
            const walletTransfers: Transfer[] = walletResponse.data.transactions.map(
              (tx: WalletTransactionRow) => {
                const balanceAfter = tx.balance_after ? parseFloat(tx.balance_after) : 0;
                const amt = parseFloat(tx.amount) || 0;

                return {
                  id: tx.id,
                  date: tx.created_at,
                  type: tx.transaction_type === 'deposit' ? 'Deposit' : 'Withdrawal',
                  amount: amt,
                  usdpChange: tx.transaction_type === 'deposit' ? amt : -amt,
                  balance: isNaN(balanceAfter) ? 0 : balanceAfter,
                  txid: tx.id,
                  status: 'Completed',
                  failure_reason: null,
                  source: 'wallet' as const,
                };
              }
            );
            newTransfers.push(...walletTransfers);

            if (walletResponse.data?.pagination) {
              walletHasMore = walletResponse.data.pagination.has_more || false;
              walletTotal = walletResponse.data.pagination.total || 0;
            }
          }

          if (paymentResponse.success && paymentResponse.data?.transactions) {
            const paymentTransfers: Transfer[] = paymentResponse.data.transactions
              .filter((tx: PaymentTransaction) =>
                ['failed', 'expired', 'terminally_failed'].includes(tx.status)
              )
              .map((tx: PaymentTransaction) => {
                const amt = tx.amount_cents / 100;
                const isDeposit = tx.type === 'deposit';

                return {
                  id: tx.id,
                  date: tx.created_at,
                  type: isDeposit ? 'Deposit' : 'Withdrawal',
                  amount: amt,
                  usdpChange: isDeposit ? amt : -amt,
                  balance: null,
                  txid: tx.checkout_id || tx.id,
                  status:
                    tx.status === 'failed'
                      ? 'Failed'
                      : tx.status === 'expired'
                        ? 'Expired'
                        : tx.status === 'terminally_failed'
                          ? 'Blocked'
                          : tx.status,
                  failure_reason: tx.failure_reason,
                  source: 'payment' as const,
                  checkout_id: tx.checkout_id,
                };
              });
            newTransfers.push(...paymentTransfers);

            if (paymentResponse.data?.pagination) {
              paymentHasMore = paymentResponse.data.pagination.has_more || false;
              paymentTotal = paymentResponse.data.pagination.total || 0;
            }
          }
        }

        const merged = reset ? newTransfers : [...allLoadedTransfers, ...newTransfers];

        const deduplicated = merged.filter(
          (transfer, index, self) =>
            index === self.findIndex((t) => t.id === transfer.id && t.source === transfer.source)
        );

        const sortedTransfers = deduplicated.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setAllLoadedTransfers(sortedTransfers);
        setLastFetchedPage(reset ? pagesToFetch : lastFetchedPage + pagesToFetch);

        if (reset) {
          setCurrentDisplayCount(TRANSACTIONS_PER_PAGE);
        } else {
          setCurrentDisplayCount((prev) => prev + TRANSACTIONS_PER_PAGE);
        }

        const combinedTotal = walletTotal + paymentTotal;
        const hasMore =
          sortedTransfers.length > currentDisplayCount + TRANSACTIONS_PER_PAGE ||
          walletHasMore ||
          paymentHasMore;

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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load transfers';
        setError(message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [allLoadedTransfers, currentDisplayCount, lastFetchedPage]
  );

  const transfers = useMemo(() => {
    return allLoadedTransfers.slice(0, currentDisplayCount);
  }, [allLoadedTransfers, currentDisplayCount]);

  const loadMore = useCallback(() => {
    if (pagination.has_more && !loadingMore && !loading) {
      loadTransfers(false);
    }
  }, [pagination, loadingMore, loading, loadTransfers]);

  const handleSuccessRefresh = useCallback(
    (checkoutId: string, balanceAfter?: number) => {
      if (refreshedCheckoutIdsRef.current.has(checkoutId)) {
        return;
      }
      refreshedCheckoutIdsRef.current.add(checkoutId);

      if (balanceAfter === undefined) {
        refetchWallet();
      }

      loadTransfers(true);
    },
    [refetchWallet, loadTransfers]
  );

  // WebSocket for real-time updates
  usePaymentWebSocket({
    onPaymentUpdate: (event) => {
      const eventId = `${event.checkout_id}-${event.status}`;

      if (lastProcessedEventRef.current === eventId) {
        return;
      }

      lastProcessedEventRef.current = eventId;
      setNotificationEvent(event);

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

  // Restore pending payment on mount
  useEffect(() => {
    const urlType = searchParams.get('type') as 'deposit' | 'withdraw' | null;
    const urlAmount = searchParams.get('amount');

    if (urlType && urlAmount) {
      setAction(urlType === 'deposit' ? 'deposit' : 'withdraw');
      setAmount(urlAmount);
      router.replace('/account/deposit', { scroll: false });
    } else {
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
      const response = await initiateDeposit(depositAmount);

      if (response.success && response.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error(response.message || 'Failed to initiate deposit');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Deposit failed';
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

      const response = await initiateWithdrawal(withdrawAmount);

      if (response.success && response.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error(response.message || 'Failed to initiate withdrawal');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Withdrawal failed';
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
      hour12: true,
    });
    return { date: dateStr, time: timeStr };
  };

  if (loading || walletLoading) {
    return <WalletDepositsWithdrawalsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Payment Notification */}
      <PaymentNotification event={notificationEvent} onDismiss={() => setNotificationEvent(null)} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono mb-2" style={{ color: colors.textPrimary }}>
            Deposits & Withdrawals
          </h1>
          <p className="font-mono" style={{ color: colors.textSecondary }}>
            Manage your $ deposits and withdrawals
          </p>
        </div>
        <Button onClick={() => loadTransfers(true)} className="font-mono" disabled={loading}>
          {loading ? 'Loading...' : '↻ Refresh'}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div
          className="px-4 py-3 rounded font-mono"
          style={{
            backgroundColor: `${colors.red}19`,
            border: `1px solid ${colors.red}4d`,
            color: colors.red,
          }}
        >
          {error}
        </div>
      )}

      {/* Current Balance */}
      <div
        className="rounded-lg p-6"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div
              className="text-sm uppercase tracking-wide font-mono mb-2"
              style={{ color: colors.textSecondary }}
            >
              USD Balance
            </div>
            <div
              className="text-4xl font-bold tabular-nums font-mono"
              style={{ color: colors.textPrimary }}
            >
              {formatCurrency(usdpBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* Deposit/Withdrawal Form */}
      <div
        className="rounded-lg p-6"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        <h2 className="text-lg font-semibold font-mono mb-4" style={{ color: colors.textPrimary }}>
          {action === 'deposit' ? 'Deposit $' : 'Withdraw $'}
        </h2>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => setAction('deposit')}
                className="flex-1 font-mono"
                style={{
                  backgroundColor: action === 'deposit' ? colors.green : colors.box,
                  color: action === 'deposit' ? colors.textDark : colors.textPrimary,
                }}
              >
                Deposit
              </Button>
              <Button
                onClick={() => setAction('withdraw')}
                className="flex-1 font-mono"
                style={{
                  backgroundColor: action === 'withdraw' ? colors.red : colors.box,
                  color: action === 'withdraw' ? colors.textPrimary : colors.textPrimary,
                }}
              >
                Withdrawal
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  className="block text-sm font-medium font-mono mb-1"
                  style={{ color: colors.textSecondary }}
                >
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
                className="w-full font-mono"
                style={{
                  backgroundColor: action === 'deposit' ? colors.green : colors.red,
                  color: action === 'deposit' ? colors.textDark : colors.textPrimary,
                }}
              >
                {actionLoading
                  ? 'Processing...'
                  : action === 'deposit'
                    ? 'Deposit'
                    : 'Withdraw'}
              </Button>
            </div>
          </div>

          {/* Info Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: colors.box,
                border: `1px solid ${colors.boxOutline}`,
              }}
            >
              <h3
                className="text-sm font-semibold font-mono mb-2"
                style={{ color: colors.textPrimary }}
              >
                {action === 'deposit' ? 'Deposit Information' : 'Withdrawal Information'}
              </h3>
              <div className="text-sm font-mono space-y-1" style={{ color: colors.textSecondary }}>
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
              <div
                className="rounded-lg p-4"
                style={{
                  backgroundColor: colors.box,
                  border: `1px solid ${colors.boxOutline}`,
                }}
              >
                <h3
                  className="text-sm font-semibold font-mono mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Withdrawal Limits
                </h3>
                <div
                  className="text-sm font-mono space-y-1"
                  style={{ color: colors.textSecondary }}
                >
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
      <div
        className="rounded-lg overflow-hidden"
        style={{
          backgroundColor: colors.box,
          border: `1px solid ${colors.boxOutline}`,
        }}
      >
        <div className="p-6" style={{ borderBottom: `1px solid ${colors.boxOutline}` }}>
          <h2
            className="text-lg font-semibold font-mono"
            style={{ color: colors.textPrimary }}
          >
            Transfer History
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ borderBottom: `1px solid ${colors.boxOutline}` }}>
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider font-mono"
                  style={{ color: colors.textSecondary }}
                >
                  Date & Time
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider font-mono"
                  style={{ color: colors.textSecondary }}
                >
                  Type
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider font-mono"
                  style={{ color: colors.textSecondary }}
                >
                  Amount $
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider font-mono"
                  style={{ color: colors.textSecondary }}
                >
                  Balance After
                </th>
                <th
                  className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider font-mono"
                  style={{ color: colors.textSecondary }}
                >
                  Status
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider font-mono"
                  style={{ color: colors.textSecondary }}
                >
                  Transaction ID
                </th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((transfer) => {
                const dateTime = formatDate(transfer.date);
                const isCompleted = transfer.status === 'Completed';
                const isFailed = ['Failed', 'Expired', 'Blocked'].includes(transfer.status);
                const isDeposit = transfer.type === 'Deposit';
                const hasFailureReason = transfer.failure_reason && transfer.source === 'payment';

                const getStatusBadge = () => {
                  if (isCompleted) {
                    return {
                      Icon: CheckCircle,
                      bgColor: `${colors.green}19`,
                      iconColor: colors.green,
                    };
                  } else if (transfer.status === 'Failed') {
                    return {
                      Icon: XCircle,
                      bgColor: `${colors.red}19`,
                      iconColor: colors.red,
                    };
                  } else if (transfer.status === 'Expired') {
                    return {
                      Icon: Clock,
                      bgColor: '#F9731619',
                      iconColor: '#F97316',
                    };
                  } else if (transfer.status === 'Blocked') {
                    return {
                      Icon: Ban,
                      bgColor: `${colors.red}19`,
                      iconColor: colors.red,
                    };
                  }
                  return {
                    Icon: XCircle,
                    bgColor: `${colors.red}19`,
                    iconColor: colors.red,
                  };
                };

                const statusBadge = getStatusBadge();
                const StatusIcon = statusBadge.Icon;

                return (
                  <tr
                    key={`${transfer.source}-${transfer.id}`}
                    className="hover:opacity-80 transition-opacity"
                    style={{ borderBottom: `1px solid ${colors.boxOutline}` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span
                          className="text-xs font-mono"
                          style={{ color: colors.textPrimary }}
                        >
                          {dateTime.date}
                        </span>
                        <span
                          className="text-xs font-mono"
                          style={{ color: colors.textMuted }}
                        >
                          {dateTime.time}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-md font-mono border"
                        style={{
                          color: isDeposit ? colors.green : colors.red,
                          backgroundColor: isDeposit
                            ? `${colors.green}19`
                            : `${colors.red}19`,
                          borderColor: isDeposit
                            ? `${colors.green}33`
                            : `${colors.red}33`,
                        }}
                      >
                        {transfer.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span
                        className="text-sm font-semibold font-mono tabular-nums"
                        style={{
                          color: transfer.usdpChange >= 0 ? colors.green : colors.red,
                        }}
                      >
                        {transfer.usdpChange >= 0 ? '+' : ''}
                        {formatCurrency(transfer.usdpChange)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span
                        className="text-sm font-semibold font-mono tabular-nums"
                        style={{ color: colors.textPrimary }}
                      >
                        {transfer.balance !== null && !isNaN(transfer.balance)
                          ? formatCurrency(transfer.balance)
                          : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full"
                          style={{ backgroundColor: statusBadge.bgColor }}
                        >
                          <StatusIcon
                            className="w-4 h-4"
                            style={{ color: statusBadge.iconColor }}
                          />
                        </span>
                        {hasFailureReason && (
                          <span
                            className="text-xs font-mono max-w-[120px] text-center truncate"
                            style={{ color: colors.textSecondary }}
                            title={getFailureMessage(transfer.failure_reason)}
                          >
                            {getFailureMessage(transfer.failure_reason)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="text-xs font-mono font-medium"
                        style={{ color: colors.textSecondary }}
                      >
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
          <div
            className="p-6 flex justify-center"
            style={{ borderTop: `1px solid ${colors.boxOutline}` }}
          >
            <Button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-2 px-4 font-semibold font-mono rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: colors.gold,
                color: colors.textDark,
              }}
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>

      {transfers.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="font-mono" style={{ color: colors.textSecondary }}>
            No transfers found.
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: colors.box,
            border: `1px solid ${colors.boxOutline}`,
          }}
        >
          <div
            className="text-xs uppercase tracking-wide font-mono mb-1"
            style={{ color: colors.textSecondary }}
          >
            Total Deposits
          </div>
          <div className="text-lg font-semibold tabular-nums font-mono" style={{ color: colors.green }}>
            {formatCurrency(
              transfers
                .filter((t) => t.type === 'Deposit')
                .reduce((sum, t) => sum + t.amount, 0)
            )}
          </div>
        </div>
        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: colors.box,
            border: `1px solid ${colors.boxOutline}`,
          }}
        >
          <div
            className="text-xs uppercase tracking-wide font-mono mb-1"
            style={{ color: colors.textSecondary }}
          >
            Total Withdrawals
          </div>
          <div className="text-lg font-semibold tabular-nums font-mono" style={{ color: colors.red }}>
            {formatCurrency(
              transfers
                .filter((t) => t.type === 'Withdrawal')
                .reduce((sum, t) => sum + t.amount, 0)
            )}
          </div>
        </div>
        <div
          className="rounded-lg p-4"
          style={{
            backgroundColor: colors.box,
            border: `1px solid ${colors.boxOutline}`,
          }}
        >
          <div
            className="text-xs uppercase tracking-wide font-mono mb-1"
            style={{ color: colors.textSecondary }}
          >
            Net Flow
          </div>
          <div
            className="text-lg font-semibold tabular-nums font-mono"
            style={{
              color:
                transfers.reduce((sum, t) => sum + t.usdpChange, 0) >= 0
                  ? colors.green
                  : colors.red,
            }}
          >
            {transfers.reduce((sum, t) => sum + t.usdpChange, 0) >= 0 ? '+' : ''}
            {formatCurrency(transfers.reduce((sum, t) => sum + t.usdpChange, 0))}
          </div>
        </div>
      </div>
    </div>
  );
}
