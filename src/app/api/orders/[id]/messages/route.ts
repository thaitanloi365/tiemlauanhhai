import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { orderMessageCreateSchema } from '@/lib/schemas';
import { isChatReadonlyByOrderStatus } from '@/lib/constants/chat';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const customerMessagePayloadSchema = orderMessageCreateSchema.extend({
  sessionId: z.string().uuid('Session không hợp lệ'),
});

async function getOrderById(orderId: string) {
  const supabase = createServerSupabase();
  const { data: order, error } = await supabase
    .from('orders')
    .select('id,session_id,status,customer_last_seen_message_at')
    .eq('id', orderId)
    .single();
  if (error || !order) return null;
  return order;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ message: 'Thiếu sessionId' }, { status: 400 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ messages: [] });
  }

  const order = await getOrderById(params.id);
  if (!order) {
    return NextResponse.json({ message: 'Không tìm thấy đơn hàng' }, { status: 404 });
  }
  if (order.session_id !== sessionId) {
    return NextResponse.json({ message: 'Không có quyền truy cập chat' }, { status: 403 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('order_messages')
    .select('*')
    .eq('order_id', params.id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  const latestAdminMessage = [...(data ?? [])]
    .reverse()
    .find((message) => message.sender_type === 'admin');
  const hasUnreadForCustomer = Boolean(
    latestAdminMessage?.created_at &&
      (!order.customer_last_seen_message_at ||
        new Date(latestAdminMessage.created_at).getTime() >
          new Date(order.customer_last_seen_message_at).getTime()),
  );

  return NextResponse.json({
    messages: (data ?? []) as AppTypes.OrderMessage[],
    readonly: isChatReadonlyByOrderStatus(order.status),
    has_unread_for_customer: hasUnreadForCustomer,
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const payload = await request.json().catch(() => null);
  const parsed = customerMessagePayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Payload không hợp lệ' },
      { status: 400 },
    );
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { message: 'Chat chỉ hoạt động khi có cấu hình Supabase' },
      { status: 400 },
    );
  }

  const { sessionId, content, images } = parsed.data;
  const order = await getOrderById(params.id);
  if (!order) {
    return NextResponse.json({ message: 'Không tìm thấy đơn hàng' }, { status: 404 });
  }
  if (order.session_id !== sessionId) {
    return NextResponse.json({ message: 'Không có quyền gửi tin nhắn' }, { status: 403 });
  }
  if (isChatReadonlyByOrderStatus(order.status)) {
    return NextResponse.json(
      { message: 'Đơn hàng đã hoàn tất, chat chỉ còn chế độ xem' },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('order_messages')
    .insert({
      order_id: params.id,
      sender_type: 'customer',
      sender_id: sessionId,
      content: content?.trim() || null,
      images: images ?? [],
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  await supabase
    .from('orders')
    .update({ customer_last_seen_message_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('session_id', sessionId);
  return NextResponse.json({ message: data as AppTypes.OrderMessage });
}
