import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { resolveAdminUserFromRequest } from '@/lib/server/next-admin';

type ReviewWithOrder = AppTypes.Review & {
  order: Pick<
    AppTypes.Order,
    'id' | 'customer_name' | 'phone' | 'status' | 'total_amount' | 'created_at'
  > | null;
};

export async function GET(request: NextRequest) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ reviews: [] });
  }

  const query = request.nextUrl.searchParams.get('q')?.trim().toLowerCase() ?? '';
  const orderId = request.nextUrl.searchParams.get('orderId')?.trim() ?? '';
  const ratingParam = request.nextUrl.searchParams.get('rating')?.trim() ?? '';
  const status = request.nextUrl.searchParams.get('status')?.trim() ?? '';
  const sort = request.nextUrl.searchParams.get('sort')?.trim() || 'newest';

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('reviews')
    .select(
      'id,order_id,session_id,rating,comment,created_at,order:orders(id,customer_name,phone,status,total_amount,created_at)',
    )
    .order('created_at', { ascending: sort === 'oldest' });
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  const ratingFilter = Number(ratingParam);
  const rows = (data ?? []).map((row) => ({
    ...(row as AppTypes.Review),
    order: Array.isArray((row as { order?: unknown }).order)
      ? (((row as { order?: unknown[] }).order?.[0] ?? null) as ReviewWithOrder['order'])
      : (((row as { order?: unknown }).order ?? null) as ReviewWithOrder['order']),
  })) as ReviewWithOrder[];
  const reviews = rows.filter((row) => {
    if (orderId && row.order_id !== orderId) return false;
    if (Number.isFinite(ratingFilter) && ratingFilter >= 1 && ratingFilter <= 5) {
      if (row.rating !== ratingFilter) return false;
    }
    if (status && row.order?.status !== status) return false;
    if (query) {
      const fulltext = [
        row.comment,
        row.order_id,
        row.order?.customer_name ?? '',
        row.order?.phone ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!fulltext.includes(query)) return false;
    }
    return true;
  });

  return NextResponse.json({ reviews });
}
