import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { mockDb } from '@/lib/server/mock-db';
import { adminOrderUpdateSchema } from '@/lib/schemas';
import { resolveAdminUserFromRequest } from '@/lib/server/next-admin';
import { logPromotionSecurityEvent } from '@/lib/server/promotion-security-log';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const params = await context.params;
  const orderId = params.id;
  if (!orderId)
    return NextResponse.json({ message: 'Thiếu mã đơn hàng' }, { status: 400 });

  if (!hasSupabaseConfig()) {
    const detail = mockDb.getOrderDetail(orderId);
    if (!detail)
      return NextResponse.json(
        { message: 'Không tìm thấy đơn hàng' },
        { status: 404 },
      );
    return NextResponse.json(detail);
  }

  const supabase = createServerSupabase();
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  if (orderError || !order)
    return NextResponse.json(
      { message: 'Không tìm thấy đơn hàng' },
      { status: 404 },
    );

  const [{ data: items }, { data: logs }, { data: review }, { data: messages }] = await Promise.all(
    [
      supabase
        .from('order_items')
        .select(
          '*,menu_variant:menu_variants(*,menu_item:menu_items(id,name,slug,thumbnail_url))',
        )
        .eq('order_id', order.id),
      supabase
        .from('order_status_logs')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('reviews')
        .select('*')
        .eq('order_id', order.id)
        .maybeSingle(),
      supabase
        .from('order_messages')
        .select('sender_type,created_at')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false }),
    ],
  );
  const latestCustomerMessageAt = (messages ?? []).find(
    (message) => message.sender_type === 'customer',
  )?.created_at as string | undefined;
  const adminLastSeen = order.admin_last_seen_message_at as string | null;

  return NextResponse.json({
    order,
    items: items ?? [],
    logs: logs ?? [],
    review: review ?? null,
    has_chat: (messages ?? []).length > 0,
    has_unread_for_admin: Boolean(
      latestCustomerMessageAt &&
        (!adminLastSeen ||
          new Date(latestCustomerMessageAt).getTime() >
            new Date(adminLastSeen).getTime()),
    ),
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const params = await context.params;
  const orderId = params.id;
  if (!orderId)
    return NextResponse.json({ message: 'Thiếu mã đơn hàng' }, { status: 400 });

  const payload = await request.json().catch(() => null);
  const parsed = adminOrderUpdateSchema.safeParse(payload);
  if (!parsed.success)
    return NextResponse.json(
      { message: 'Payload không hợp lệ' },
      { status: 400 },
    );

  if (!hasSupabaseConfig()) {
    const updates: Partial<AppTypes.Order> = {
      status: parsed.data.status,
      tracking_id: parsed.data.tracking_id ?? null,
      tracking_url: parsed.data.tracking_url ?? null,
    };
    if (parsed.data.status === 'confirmed') {
      updates.expired_at = null;
    }
    const updated = mockDb.updateOrder(orderId, updates);
    if (!updated)
      return NextResponse.json(
        { message: 'Không tìm thấy đơn' },
        { status: 404 },
      );
    return NextResponse.json({ ok: true });
  }

  const supabase = createServerSupabase();
  const { data: currentOrder, error: currentOrderError } = await supabase
    .from('orders')
    .select('id,status,promotion_id')
    .eq('id', orderId)
    .maybeSingle();
  if (currentOrderError || !currentOrder) {
    return NextResponse.json({ message: 'Không tìm thấy đơn' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    status: parsed.data.status,
    tracking_id: parsed.data.tracking_id ?? null,
    tracking_url: parsed.data.tracking_url ?? null,
  };
  if (parsed.data.status === 'confirmed') {
    updates.expired_at = null;
  }
  const { error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId);

  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });

  const shouldReleasePromotion =
    parsed.data.status === 'cancelled' &&
    currentOrder.status !== 'cancelled' &&
    Boolean(currentOrder.promotion_id);
  if (shouldReleasePromotion) {
    const { error: releaseError } = await supabase.rpc('release_promotion_usage', {
      p_order_id: orderId,
      p_now: new Date().toISOString(),
    });
    if (releaseError) {
      await logPromotionSecurityEvent({
        eventType: 'promotion_release_failed',
        reason: releaseError.message,
        metadata: { orderId },
      });
      return NextResponse.json({ message: releaseError.message }, { status: 500 });
    }
  }

  await supabase.from('order_status_logs').insert({
    order_id: orderId,
    status: parsed.data.status,
    note: 'Cập nhật từ admin',
  });

  return NextResponse.json({ ok: true });
}
