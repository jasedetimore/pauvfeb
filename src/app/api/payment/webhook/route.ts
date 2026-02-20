import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * Soap Payment Webhook Handler
 *
 * Receives webhook events from Soap when payment status changes.
 * Docs: https://docs.paywithsoap.com/api-reference/api-v1/webhooks/webhooks
 *
 * Events handled:
 * - checkout.succeeded  – payment completed, credit/debit balance
 * - checkout.failed     – payment failed
 * - checkout.expired    – checkout session expired
 * - checkout.hold       – withdrawal hold request (must respond 2xx if balance sufficient)
 * - checkout.release_hold – withdrawal failed after hold, refund if debited
 * - checkout.returned   – payment reversed after success
 * - checkout.voided     – deposit charge voided after success
 * - checkout.pending    – checkout entered pending state
 * - checkout.terminally_failed – failed due to geo/kyc/fraud
 *
 * Signature: SOAP-WEBHOOK-SIGNATURE header with format t=<ts>,v1=<hmac-sha256>
 * Idempotency: event_id is used to prevent duplicate processing
 */

// ─── Signature verification ───────────────────────────────────────────────

function verifySignature(
  payload: string,
  signatureHeader: string,
  signingSecret: string
): boolean {
  const parts = signatureHeader.split(',');
  const timestampPart = parts.find((p) => p.startsWith('t='));
  const signaturePart = parts.find((p) => p.startsWith('v1='));

  if (!timestampPart || !signaturePart) return false;

  const timestamp = timestampPart.split('=')[1];
  const receivedSignature = signaturePart.split('=')[1];

  const message = `${timestamp}.${payload}`;
  const calculatedSignature = crypto
    .createHmac('sha256', signingSecret)
    .update(message)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(receivedSignature, 'hex'),
      Buffer.from(calculatedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const payload = await req.text();

    // Verify webhook signature
    const signatureHeader = req.headers.get('soap-webhook-signature');
    const webhookSecret = process.env.SOAP_WEBHOOK_SECRET;

    if (webhookSecret && signatureHeader) {
      if (!verifySignature(payload, signatureHeader, webhookSecret)) {
        console.error('[Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else if (webhookSecret && !signatureHeader) {
      console.error('[Webhook] Missing SOAP-WEBHOOK-SIGNATURE header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const event = JSON.parse(payload);
    const eventId: string = event.event_id;
    const eventType: string = event.type;
    const checkoutId: string | undefined = event.data?.id;
    const chargeAmountCents: number | undefined = event.data?.charge?.amount_cents;
    const transactionType: string | undefined = event.data?.charge?.transaction_type; // credit | debit
    const dataType: string | undefined = event.data?.type; // deposit | withdrawal
    const customerId: string | undefined = event.data?.customer?.id;

    console.log(`[Webhook] event_id=${eventId} type=${eventType} checkout=${checkoutId}`);

    if (!checkoutId) {
      console.warn('[Webhook] No checkout id (data.id) in event');
      return NextResponse.json({ received: true, warning: 'no checkout id' });
    }

    // ── Idempotency check ────────────────────────────────────────────────
    // Use event_id to prevent duplicate processing (Soap retries up to 4×)
    const { data: existing } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('checkout_id', checkoutId)
      .single();

    if (existing?.provider_data?.processed_events?.includes(eventId)) {
      console.log(`[Webhook] Already processed event_id=${eventId}, skipping`);
      return NextResponse.json({ received: true, deduplicated: true });
    }

    // ── Find or create transaction record ────────────────────────────────
    let transaction = existing;

    if (!transaction) {
      console.warn(`[Webhook] Transaction not found for checkout=${checkoutId}`);
      return NextResponse.json({ received: true, warning: 'transaction not found' });
    }

    // ── Route by event type ──────────────────────────────────────────────

    switch (eventType) {
      // ───────── checkout.hold (withdrawal only) ─────────────────────────
      // Soap asks us if the user has sufficient balance.
      // Respond 2xx → proceed. Non-2xx → abort.
      // We debit immediately (Soap recommends this).
      case 'checkout.hold': {
        const holdAmount = (chargeAmountCents ?? transaction.amount_cents) / 100;

        // Use Atomic Function: Increment (Decrement) Balance
        // We pass a negative amount. The DB checks constraint (balance >= 0) automatically.
        const { data: newBalance, error: rpcError } = await supabaseAdmin.rpc(
          'increment_user_balance',
          {
            p_user_id: transaction.user_id,
            p_amount: -holdAmount,
          }
        );

        if (rpcError) {
          console.log(
            `[Webhook] Hold failed: ${rpcError.message}. User likely has insufficient balance.`
          );
          // If RPC failed (likely due to check constraint), we return 402
          return NextResponse.json(
            { error: 'Insufficient balance' },
            { status: 402 }
          );
        }

        await updateTransaction(supabaseAdmin, transaction.id, {
          status: 'held',
          balance_after: newBalance,
          provider_data: appendProcessedEvent(transaction.provider_data, eventId, event),
        });

        console.log(
          `[Webhook] Hold: debited $${holdAmount}. New balance $${newBalance}`
        );

        return NextResponse.json({ received: true, status: 'held' });
      }

      // ───────── checkout.release_hold ───────────────────────────────────
      // Withdrawal failed after we placed a hold → refund the held amount.
      case 'checkout.release_hold': {
        if (transaction.status === 'held') {
          const refundAmount = transaction.amount_cents / 100;

          // Atomic Refund
          const { data: newBalance, error: rpcError } = await supabaseAdmin.rpc(
            'increment_user_balance',
            {
              p_user_id: transaction.user_id,
              p_amount: refundAmount,
            }
          );

          if (rpcError) {
            console.error(`[Webhook] Release hold refund failed: ${rpcError.message}`);
            // Critical error, should trigger manual intervention alert
          }

          await updateTransaction(supabaseAdmin, transaction.id, {
            status: 'failed',
            balance_after: newBalance,
            failure_reason: 'withdrawal_released_after_hold',
            provider_data: appendProcessedEvent(transaction.provider_data, eventId, event),
          });

          console.log(
            `[Webhook] Release hold: refunded $${refundAmount}. New balance $${newBalance}`
          );
        } else {
          // We never debited, just mark failed
          await updateTransaction(supabaseAdmin, transaction.id, {
            status: 'failed',
            failure_reason: 'withdrawal_released_after_hold',
            provider_data: appendProcessedEvent(transaction.provider_data, eventId, event),
          });
        }

        return NextResponse.json({ received: true, status: 'failed' });
      }

      // ───────── checkout.succeeded ──────────────────────────────────────
      case 'checkout.succeeded': {
        const amountDollars = (chargeAmountCents ?? transaction.amount_cents) / 100;
        const isDeposit = (dataType || transaction.type) === 'deposit';

        let newBalance = 0; // Will be set by RPC

        if (isDeposit) {
          // Credit balance for deposits
          const { data, error } = await supabaseAdmin.rpc('increment_user_balance', {
            p_user_id: transaction.user_id,
            p_amount: amountDollars,
          });
          if (error) throw error;
          newBalance = data;
        } else {
          // For withdrawals: if we already debited on hold, skip second debit.
          if (transaction.status !== 'held') {
            // Should initiate a debit here if not held, but typical flow is hold -> succeed
            // If status is NOT 'held', it means we skipped the hold step somehow?
            // Or maybe it's just a direct debit without hold.
            // Safer to assume if not held, we debit.
            const { data, error } = await supabaseAdmin.rpc('increment_user_balance', {
              p_user_id: transaction.user_id,
              p_amount: -amountDollars,
            });
            if (error) {
              // If this fails (insufficient funds), it's weird because checkout succeeded.
              // We should log this critically.
              console.error(`[Webhook] Withdrawal succeeded but debit failed: ${error.message}`);
            } else {
              newBalance = data;
            }
          } else {
            // Already debited, just fetch current balance for record keeping
            const { data } = await supabaseAdmin.from('users').select('usdp_balance').eq('user_id', transaction.user_id).single();
            newBalance = data?.usdp_balance;
          }
        }

        await updateTransaction(supabaseAdmin, transaction.id, {
          status: 'succeeded',
          balance_after: newBalance,
          provider_data: appendProcessedEvent(transaction.provider_data, eventId, event),
        });

        console.log(
          `[Webhook] ${isDeposit ? 'Deposit' : 'Withdrawal'} succeeded: $${amountDollars}. ` +
          `New Balance $${newBalance}`
        );

        return NextResponse.json({ received: true, status: 'succeeded' });
      }

      // ───────── checkout.returned ───────────────────────────────────────
      // A previously succeeded payment was reversed.
      case 'checkout.returned': {
        if (transaction.status === 'succeeded') {
          const amountDollars = transaction.amount_cents / 100;
          const isDeposit = transaction.type === 'deposit';

          // Reverse the action
          // Deposit returned -> Debit user
          // Withdrawal returned -> Credit user
          const amountChange = isDeposit ? -amountDollars : amountDollars;

          const { data: newBalance, error } = await supabaseAdmin.rpc('increment_user_balance', {
            p_user_id: transaction.user_id,
            p_amount: amountChange,
          });

          if (error) console.error(`[Webhook] Returned op failed: ${error.message}`);

          await updateTransaction(supabaseAdmin, transaction.id, {
            status: 'returned',
            balance_after: newBalance,
            provider_data: appendProcessedEvent(transaction.provider_data, eventId, event),
          });

          console.log(
            `[Webhook] Returned: reversed $${amountDollars}. New Balance $${newBalance}`
          );
        }

        return NextResponse.json({ received: true, status: 'returned' });
      }

      // ───────── checkout.voided ─────────────────────────────────────────
      // A deposit charge was voided after it succeeded.
      case 'checkout.voided': {
        if (transaction.status === 'succeeded' && transaction.type === 'deposit') {
          const amountDollars = transaction.amount_cents / 100;

          // Void Access -> Debit user
          const { data: newBalance, error } = await supabaseAdmin.rpc('increment_user_balance', {
            p_user_id: transaction.user_id,
            p_amount: -amountDollars,
          });

          if (error) console.error(`[Webhook] Void op failed: ${error.message}`);

          await updateTransaction(supabaseAdmin, transaction.id, {
            status: 'voided',
            balance_after: newBalance,
            provider_data: appendProcessedEvent(transaction.provider_data, eventId, event),
          });

          console.log(
            `[Webhook] Voided deposit: -$${amountDollars}. New Balance $${newBalance}`
          );
        }

        return NextResponse.json({ received: true, status: 'voided' });
      }

      // ───────── checkout.failed ─────────────────────────────────────────
      case 'checkout.failed': {
        await updateTransaction(supabaseAdmin, transaction.id, {
          status: 'failed',
          failure_reason: event.data?.charge?.from_status || 'payment_failed',
          provider_data: appendProcessedEvent(transaction.provider_data, eventId, event),
        });

        return NextResponse.json({ received: true, status: 'failed' });
      }

      // ───────── checkout.expired ────────────────────────────────────────
      case 'checkout.expired': {
        await updateTransaction(supabaseAdmin, transaction.id, {
          status: 'expired',
          failure_reason: 'checkout_expired',
          provider_data: appendProcessedEvent(transaction.provider_data, eventId, event),
        });

        return NextResponse.json({ received: true, status: 'expired' });
      }

      // ───────── checkout.terminally_failed ──────────────────────────────
      case 'checkout.terminally_failed': {
        await updateTransaction(supabaseAdmin, transaction.id, {
          status: 'terminally_failed',
          failure_reason: 'compliance_check_failed',
          provider_data: appendProcessedEvent(transaction.provider_data, eventId, event),
        });

        return NextResponse.json({ received: true, status: 'terminally_failed' });
      }

      // ───────── checkout.pending ────────────────────────────────────────
      case 'checkout.pending': {
        await updateTransaction(supabaseAdmin, transaction.id, {
          status: 'pending',
          provider_data: appendProcessedEvent(transaction.provider_data, eventId, event),
        });

        return NextResponse.json({ received: true, status: 'pending' });
      }

      default: {
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
        return NextResponse.json({ received: true });
      }
    }
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

async function updateTransaction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  id: string,
  data: Record<string, unknown>
) {
  const { error } = await supabase
    .from('payment_transactions')
    .update(data)
    .eq('id', id);

  if (error) {
    console.error(`[Webhook] Failed to update transaction ${id}:`, error);
  }
}

/**
 * Append event_id to the provider_data.processed_events array for idempotency.
 */
function appendProcessedEvent(
  existingData: Record<string, unknown> | null,
  eventId: string,
  rawEvent: unknown
): Record<string, unknown> {
  const data = existingData || {};
  const processed = Array.isArray(data.processed_events) ? (data.processed_events as string[]) : [];
  return {
    ...data,
    last_event: rawEvent,
    processed_events: [...processed, eventId],
  };
}
