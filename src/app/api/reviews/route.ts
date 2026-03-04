import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { toIso } from '@/lib/date';
import { mockDb } from '@/lib/server/mock-db';
import { reviewSchema } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Payload không hợp lệ' },
      { status: 400 },
    );
  }

  const body = parsed.data;

  if (!hasSupabaseConfig()) {
    const detail = mockDb.getOrderDetail(body.order_id, body.session_id);
    if (!detail)
      return NextResponse.json(
        { message: 'Đơn hàng không hợp lệ' },
        { status: 403 },
      );
    if (detail.order.status !== 'delivered') {
      return NextResponse.json(
        { message: 'Chỉ đánh giá được đơn đã giao' },
        { status: 400 },
      );
    }
    const ok = mockDb.createReview({
      id: crypto.randomUUID(),
      order_id: body.order_id,
      session_id: body.session_id,
      rating: body.rating,
      comment: body.comment,
      created_at: toIso(),
    });
    if (!ok)
      return NextResponse.json(
        { message: 'Đơn này đã được đánh giá' },
        { status: 400 },
      );
    return NextResponse.json({ ok: true });
  }

  const supabase = createServerSupabase();
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id,status,session_id')
    .eq('id', body.order_id)
    .single();
  if (orderError || !order)
    return NextResponse.json(
      { message: 'Không tìm thấy đơn hàng' },
      { status: 404 },
    );
  if (order.session_id !== body.session_id)
    return NextResponse.json(
      { message: 'Session không khớp đơn hàng' },
      { status: 403 },
    );
  if (order.status !== 'delivered')
    return NextResponse.json(
      { message: 'Chỉ đánh giá được đơn đã giao' },
      { status: 400 },
    );

  const { error } = await supabase.from('reviews').insert({
    order_id: body.order_id,
    session_id: body.session_id,
    rating: body.rating,
    comment: body.comment,
  });
  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
