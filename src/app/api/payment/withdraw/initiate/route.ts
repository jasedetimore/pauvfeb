import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSoapCheckout, createSoapCustomer } from '@/lib/soap/client';

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

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount. Must be a positive number.' },
        { status: 400 }
      );
    }

    // Check sufficient balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('usdp_balance')
      .eq('user_id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch user balance' },
        { status: 500 }
      );
    }

    const currentBalance = parseFloat(userData.usdp_balance) || 0;
    if (amount > currentBalance) {
      return NextResponse.json(
        { success: false, message: `Insufficient balance. Available: $${currentBalance.toFixed(2)}` },
        { status: 400 }
      );
    }

    const amountCents = Math.round(amount * 100);

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

    const origin = req.nextUrl.origin;

    // Create the Soap checkout session for withdrawal
    const checkout = await createSoapCheckout({
      customer_id: customerId,
      type: 'withdrawal',
      fixed_amount_cents: amountCents,
      return_url: `${origin}/payment/success?type=withdrawal`,
    });

    const checkoutId = checkout.id;

    console.log(`[Payment] Withdrawal checkout created: ${checkoutId} for $${amount}`);

    // Store the payment transaction
    const { error: dbError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        checkout_id: checkoutId,
        type: 'withdrawal',
        status: 'pending',
        amount_cents: amountCents,
      });

    if (dbError) {
      console.error('[Payment] DB error:', dbError);
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
