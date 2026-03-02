import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { mockDb } from '@/lib/server/mock-db';
import { adminOrderUpdateSchema } from '@/lib/utils/validation';
import type { Order } from '@/lib/types';
import { resolveAdminUserFromRequest } from '@/lib/server/next-admin';

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

  const [{ data: items }, { data: logs }, { data: review }] = await Promise.all(
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
    ],
  );

  return NextResponse.json({
    order,
    items: items ?? [],
    logs: logs ?? [],
    review: review ?? null,
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
    const updates: Partial<Order> = {
      status: parsed.data.status,
      tracking_id: parsed.data.trackingId ?? null,
      tracking_url: parsed.data.trackingUrl ?? null,
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
  const updates: Record<string, unknown> = {
    status: parsed.data.status,
    tracking_id: parsed.data.trackingId ?? null,
    tracking_url: parsed.data.trackingUrl ?? null,
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

  await supabase.from('order_status_logs').insert({
    order_id: orderId,
    status: parsed.data.status,
    note: 'Cập nhật từ admin',
  });

  return NextResponse.json({ ok: true });
}
