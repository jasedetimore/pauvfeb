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

    const searchParams = req.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const statusFilter = searchParams.get('status'); // comma-separated
    const typeFilter = searchParams.get('type');

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('payment_transactions')
      .select('id, checkout_id, type, status, amount_cents, balance_after, failure_reason, created_at, updated_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter
    if (statusFilter) {
      const statuses = statusFilter.split(',').map(s => s.trim());
      query = query.in('status', statuses);
    }

    // Apply type filter
    if (typeFilter && (typeFilter === 'deposit' || typeFilter === 'withdrawal')) {
      query = query.eq('type', typeFilter);
    }

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error('[Payment] Transactions query error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions || [],
        pagination: {
          total,
          limit,
          offset,
          page,
          total_pages: totalPages,
          has_more: offset + limit < total,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('[Payment] Transactions error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
