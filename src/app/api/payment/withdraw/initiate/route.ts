import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createSoapCheckout, createSoapCustomer } from '@/lib/soap/client';

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount. Must be a positive finite number.' },
        { status: 400 }
      );
    }

    const MIN_WITHDRAWAL = 1;
    const MAX_WITHDRAWAL = 10_000;
    if (amount < MIN_WITHDRAWAL || amount > MAX_WITHDRAWAL) {
      return NextResponse.json(
        { success: false, message: `Amount must be between $${MIN_WITHDRAWAL} and $${MAX_WITHDRAWAL}.` },
        { status: 400 }
      );
    }

    const roundedAmount = Math.round(amount * 100) / 100;
    const amountCents = Math.round(roundedAmount * 100);

    // Atomically reserve (debit) the balance.
    // The DB constraint (usdp_balance >= 0) prevents over-withdrawal
    // even under concurrent requests, eliminating the TOCTOU race.
    const adminClient = createAdminClient();
    const { error: reserveError } = await adminClient.rpc(
      'increment_user_balance',
      { p_user_id: user.id, p_amount: -roundedAmount }
    );

    if (reserveError) {
      return NextResponse.json(
        { success: false, message: 'Insufficient balance for this withdrawal.' },
        { status: 400 }
      );
    }

    // Ensure Soap customer exists
    const fullName = user.user_metadata?.full_name || 'User Customer';
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    let customerId = user.user_metadata?.soap_customer_id;

    if (!customerId) {
      const customer = await createSoapCustomer({
        email: user.email,
        first_name: firstName,
        last_name: lastName,
      });
      customerId = customer.id;

      const { error: updateError } = await supabase.auth.updateUser({
        data: { soap_customer_id: customerId },
      });
      if (updateError) {
        console.warn('[Payment] Failed to persist soap_customer_id:', updateError);
      }
    }

    // Use the configured app URL; never trust forwarded headers for redirect targets
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://pauv.com';

    // Create the Soap checkout session for withdrawal.
    // If this fails, we must refund the reserved amount.
    let checkout;
    try {
      checkout = await createSoapCheckout({
        customer_id: customerId,
        type: 'withdrawal',
        fixed_amount_cents: amountCents,
        return_url: `${origin}/payment/success?type=withdrawal`,
      });
    } catch (checkoutError) {
      // Refund the reserved amount atomically
      await adminClient.rpc('increment_user_balance', {
        p_user_id: user.id,
        p_amount: roundedAmount,
      });
      throw checkoutError;
    }

    const checkoutId = checkout.id;

    console.log(`[Payment] Withdrawal checkout created: ${checkoutId}`);

    // Store the payment transaction — status 'reserved' because balance is already debited
    const { error: dbError } = await adminClient
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        checkout_id: checkoutId,
        type: 'withdrawal',
        status: 'reserved',
        amount_cents: amountCents,
      });

    if (dbError) {
      console.error('[Payment] DB error:', dbError);
      // Refund the reserved amount since we can't track this withdrawal
      await adminClient.rpc('increment_user_balance', {
        p_user_id: user.id,
        p_amount: roundedAmount,
      });
      return NextResponse.json(
        { success: false, message: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Checkout session created',
      data: {
        checkout_url: checkout.url,
        checkout_id: checkoutId,
      },
    });
  } catch (error: unknown) {
    console.error('[Payment] Withdrawal initiate error:', error);
    const message = error instanceof Error ? error.message : 'Failed to initiate withdrawal';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
