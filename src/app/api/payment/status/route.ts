import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const checkoutId = req.nextUrl.searchParams.get('checkout_id');

    if (!checkoutId) {
      return NextResponse.json(
        { success: false, message: 'checkout_id is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('payment_transactions')
      .select('checkout_id, type, status, amount_cents, created_at, updated_at')
      .eq('checkout_id', checkoutId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, message: 'Payment transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Payment] Status check error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
