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
        const { data: userRecord } = await supabaseAdmin
          .from('users')
          .select('usdp_balance')
          .eq('user_id', transaction.user_id)
          .single();

        const currentBalance = parseFloat(userRecord?.usdp_balance || '0');
        const holdAmount = (chargeAmountCents ?? transaction.amount_cents) / 100;

        if (currentBalance < holdAmount) {
          console.log(
            `[Webhook] Insufficient balance for hold. Has $${currentBalance}, needs $${holdAmount}`
          );
          // Non-2xx tells Soap the user can't afford it
          return NextResponse.json(
            { error: 'Insufficient balance' },
            { status: 402 }
          );
        }

        // Debit immediately
        const newBalance = currentBalance - holdAmount;

        await supabaseAdmin
          .from('users')
          .update({ usdp_balance: newBalance })
          .eq('user_id', transaction.user_id);

        await updateTransaction(supabaseAdmin, transaction.id, {
          status: 'held',
          balance_after: newBalance,
          provider_data: appendProcessedEvent(transaction.provider_data, eventId, event),
        });

        console.log(
          `[Webhook] Hold: debited $${holdAmount}. Balance $${currentBalance} → $${newBalance}`
        );

        return NextResponse.json({ received: true, status: 'held' });
      }

      // ───────── checkout.release_hold ───────────────────────────────────
      // Withdrawal failed after we placed a hold → refund the held amount.
      case 'checkout.release_hold': {
        if (transaction.status === 'held') {
          const { data: userRecord } = await supabaseAdmin
            .from('users')
            .select('usdp_balance')
            .eq('user_id', transaction.user_id)
            .single();

          const currentBalance = parseFloat(userRecord?.usdp_balance || '0');
          const refundAmount = transaction.amount_cents / 100;
          const newBalance = currentBalance + refundAmount;

          await supabaseAdmin
            .from('users')
            .update({ usdp_balance: newBalance })
            .eq('user_id', transaction.user_id);

          await updateTransaction(supabaseAdmin, transaction.id, {
            status: 'failed',
            balance_after: newBalance,
            failure_reason: 'withdrawal_released_after_hold',
            provider_data: appendProcessedEvent(transaction.provider_data, eventId, event),
          });

          console.log(
            `[Webhook] Release hold: refunded $${refundAmount}. Balance $${currentBalance} → $${newBalance}`
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
        const { data: userRecord } = await supabaseAdmin
          .from('users')
          .select('usdp_balance')
          .eq('user_id', transaction.user_id)
          .single();

        const currentBalance = parseFloat(userRecord?.usdp_balance || '0');
        const amountDollars = (chargeAmountCents ?? transaction.amount_cents) / 100;
        const isDeposit = (dataType || transaction.type) === 'deposit';

        let newBalance: number;

        if (isDeposit) {
          // Credit balance for deposits
          newBalance = currentBalance + amountDollars;
        } else {
          // For withdrawals: if we already debited on hold, skip second debit.
          // If status is already 'held', balance was debited → no change needed.
          if (transaction.status === 'held') {
            newBalance = currentBalance; // already debited
          } else {
            newBalance = Math.max(0, currentBalance - amountDollars);
          }
        }

        if (newBalance !== currentBalance) {
          await supabaseAdmin
            .from('users')
            .update({ usdp_balance: newBalance })
            .eq('user_id', transaction.user_id);
        }

        await updateTransaction(supabaseAdmin, transaction.id, {
          status: 'succeeded',
          balance_after: newBalance,
          provider_data: appendProcessedEvent(transaction.provider_data, eventId, event),
        });

        console.log(
          `[Webhook] ${isDeposit ? 'Deposit' : 'Withdrawal'} succeeded: $${amountDollars}. ` +
            `Balance $${currentBalance} → $${newBalance}`
        );

        return NextResponse.json({ received: true, status: 'succeeded' });
      }

      // ───────── checkout.returned ───────────────────────────────────────
      // A previously succeeded payment was reversed.
      case 'checkout.returned': {
        if (transaction.status === 'succeeded') {
          const { data: userRecord } = await supabaseAdmin
            .from('users')
            .select('usdp_balance')
            .eq('user_id', transaction.user_id)
            .single();

          const currentBalance = parseFloat(userRecord?.usdp_balance || '0');
          const amountDollars = transaction.amount_cents / 100;
          const isDeposit = transaction.type === 'deposit';

          let newBalance: number;
          if (isDeposit) {
            newBalance = Math.max(0, currentBalance - amountDollars);
          } else {
            newBalance = currentBalance + amountDollars;
          }

          await supabaseAdmin
            .from('users')
            .update({ usdp_balance: newBalance })
            .eq('user_id', transaction.user_id);

          await updateTransaction(supabaseAdmin, transaction.id, {
            status: 'returned',
            balance_after: newBalance,
            provider_data: appendProcessedEvent(transaction.provider_data, eventId, event),
          });

          console.log(
            `[Webhook] Returned: reversed $${amountDollars}. Balance $${currentBalance} → $${newBalance}`
          );
        }

        return NextResponse.json({ received: true, status: 'returned' });
      }

      // ───────── checkout.voided ─────────────────────────────────────────
      // A deposit charge was voided after it succeeded.
      case 'checkout.voided': {
        if (transaction.status === 'succeeded' && transaction.type === 'deposit') {
          const { data: userRecord } = await supabaseAdmin
            .from('users')
            .select('usdp_balance')
            .eq('user_id', transaction.user_id)
            .single();

          const currentBalance = parseFloat(userRecord?.usdp_balance || '0');
          const amountDollars = transaction.amount_cents / 100;
          const newBalance = Math.max(0, currentBalance - amountDollars);

          await supabaseAdmin
            .from('users')
            .update({ usdp_balance: newBalance })
            .eq('user_id', transaction.user_id);

          await updateTransaction(supabaseAdmin, transaction.id, {
            status: 'voided',
            balance_after: newBalance,
            provider_data: appendProcessedEvent(transaction.provider_data, eventId, event),
          });

          console.log(
            `[Webhook] Voided deposit: -$${amountDollars}. Balance $${currentBalance} → $${newBalance}`
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


