import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .select('usdp_balance')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch balance' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: parseFloat(data.usdp_balance) || 0,
      },
    });
  } catch (error) {
    console.error('[Payment] Balance error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
