import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { mockDb } from '@/lib/server/mock-db';
import { adminOrderUpdateSchema } from '@/lib/utils/validation';
import { resolveAdminUserFromRequest } from '@/lib/server/next-admin';
import type { AdminUser } from '@/lib/server/admin-auth';

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function resolveAdminUser(
  request: NextRequest,
  isAdmin: boolean,
): Promise<AdminUser | null> {
  if (!isAdmin) return null;
  return resolveAdminUserFromRequest(request);
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  const isAdmin = request.nextUrl.searchParams.get('admin') === '1';
  const adminUser = await resolveAdminUser(request, isAdmin);
  if (isAdmin && !adminUser)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!sessionId && !isAdmin)
    return NextResponse.json({ message: 'Thiếu sessionId' }, { status: 400 });

  if (!hasSupabaseConfig()) {
    const detail = mockDb.getOrderDetail(
      params.id,
      isAdmin ? undefined : (sessionId ?? ''),
    );
    if (!detail)
      return NextResponse.json(
        { message: 'Không tìm thấy đơn hàng' },
        { status: 404 },
      );
    return NextResponse.json(detail);
  }

  const supabase = createServerSupabase();
  let orderRequest = supabase.from('orders').select('*').eq('id', params.id);
  if (!isAdmin) orderRequest = orderRequest.eq('session_id', sessionId!);
  const { data: order, error: orderError } = await orderRequest.single();
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
  const params = await context.params;
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const payload = await request.json().catch(() => null);
  const parsed = adminOrderUpdateSchema.safeParse(payload);
  if (!parsed.success)
    return NextResponse.json(
      { message: 'Payload không hợp lệ' },
      { status: 400 },
    );

  if (!hasSupabaseConfig()) {
    const updated = mockDb.updateOrder(params.id ?? '', {
      status: parsed.data.status,
      tracking_id: parsed.data.trackingId ?? null,
      tracking_url: parsed.data.trackingUrl ?? null,
    });
    if (!updated)
      return NextResponse.json(
        { message: 'Không tìm thấy đơn' },
        { status: 404 },
      );
    return NextResponse.json({ ok: true });
  }

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('orders')
    .update({
      status: parsed.data.status,
      tracking_id: parsed.data.trackingId ?? null,
      tracking_url: parsed.data.trackingUrl ?? null,
    })
    .eq('id', params.id);

  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });

  await supabase.from('order_status_logs').insert({
    order_id: params.id,
    status: parsed.data.status,
    note: 'Cập nhật từ admin',
  });

  return NextResponse.json({ ok: true });
}
