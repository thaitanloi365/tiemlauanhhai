import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const payloadSchema = z.object({
  sessionId: z.string().uuid('Session không hợp lệ'),
});

export async function POST(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const payload = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Payload không hợp lệ' },
      { status: 400 },
    );
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createServerSupabase();
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id,session_id')
    .eq('id', params.id)
    .single();
  if (orderError || !order) {
    return NextResponse.json({ message: 'Không tìm thấy đơn hàng' }, { status: 404 });
  }
  if (order.session_id !== parsed.data.sessionId) {
    return NextResponse.json({ message: 'Không có quyền cập nhật đã đọc' }, { status: 403 });
  }

  const { error } = await supabase
    .from('orders')
    .update({ customer_last_seen_message_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('session_id', parsed.data.sessionId);
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
