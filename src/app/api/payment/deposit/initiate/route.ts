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

      // Persist the customer ID
      const { error: updateError } = await supabase.auth.updateUser({
        data: { soap_customer_id: customerId },
      });
      if (updateError) {
        console.warn('[Payment] Failed to persist soap_customer_id:', updateError);
      }
    }

    // Build success/failure redirect URLs
    const origin = req.nextUrl.origin;

    // Create the Soap checkout session
    const checkout = await createSoapCheckout({
      customer_id: customerId,
      type: 'deposit',
      fixed_amount_cents: amountCents,
      return_url: `${origin}/payment/success?type=deposit`,
    });

    const checkoutId = checkout.id;

    console.log(`[Payment] Deposit checkout created: ${checkoutId} for $${amount}`);

    // Store the payment transaction in our DB
    const { error: dbError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        checkout_id: checkoutId,
        type: 'deposit',
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
    console.error('[Payment] Deposit initiate error:', error);
    const message = error instanceof Error ? error.message : 'Failed to initiate deposit';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
