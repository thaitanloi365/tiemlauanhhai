import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { resolveAdminUserFromRequest } from '@/lib/server/next-admin';
import { orderMessageCreateSchema } from '@/lib/schemas';
import { isChatReadonlyByOrderStatus } from '@/lib/constants/chat';

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getOrderById(orderId: string) {
  const supabase = createServerSupabase();
  const { data: order, error } = await supabase
    .from('orders')
    .select('id,status,admin_last_seen_message_at')
    .eq('id', orderId)
    .single();
  if (error || !order) return null;
  return order;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ messages: [] });
  }

  const order = await getOrderById(params.id);
  if (!order) {
    return NextResponse.json({ message: 'Không tìm thấy đơn hàng' }, { status: 404 });
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
  const latestCustomerMessage = [...(data ?? [])]
    .reverse()
    .find((message) => message.sender_type === 'customer');
  const hasUnreadForAdmin = Boolean(
    latestCustomerMessage?.created_at &&
      (!order.admin_last_seen_message_at ||
        new Date(latestCustomerMessage.created_at).getTime() >
          new Date(order.admin_last_seen_message_at).getTime()),
  );
  return NextResponse.json({
    messages: (data ?? []) as AppTypes.OrderMessage[],
    readonly: isChatReadonlyByOrderStatus(order.status),
    has_unread_for_admin: hasUnreadForAdmin,
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const payload = await request.json().catch(() => null);
  const parsed = orderMessageCreateSchema.safeParse(payload);
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

  const order = await getOrderById(params.id);
  if (!order) {
    return NextResponse.json({ message: 'Không tìm thấy đơn hàng' }, { status: 404 });
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
      sender_type: 'admin',
      sender_id: adminUser.id,
      content: parsed.data.content?.trim() || null,
      images: parsed.data.images ?? [],
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  await supabase
    .from('orders')
    .update({ admin_last_seen_message_at: new Date().toISOString() })
    .eq('id', params.id);
  return NextResponse.json({ message: data as AppTypes.OrderMessage });
}
