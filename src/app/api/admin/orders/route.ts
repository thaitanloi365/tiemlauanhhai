import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { mockDb } from '@/lib/server/mock-db';
import { resolveAdminUserFromRequest } from '@/lib/server/next-admin';

export async function GET(request: NextRequest) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const status = request.nextUrl.searchParams.get('status');
  const query = request.nextUrl.searchParams.get('q')?.trim().toLowerCase();

  if (!hasSupabaseConfig()) {
    const stats = mockDb.getAdminStats();
    let orders = mockDb.getAllOrders();
    if (status) orders = orders.filter((order) => order.status === status);
    if (query) {
      orders = orders.filter(
        (order) =>
          order.customer_name.toLowerCase().includes(query) ||
          order.phone.toLowerCase().includes(query),
      );
    }
    return NextResponse.json({ stats, orders });
  }

  const supabase = createServerSupabase();
  let orderRequest = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (status) orderRequest = orderRequest.eq('status', status);
  if (query)
    orderRequest = orderRequest.or(
      `customer_name.ilike.%${query}%,phone.ilike.%${query}%`,
    );

  const { data: orders, error } = await orderRequest;
  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });

  const stats = {
    total: orders?.length ?? 0,
    pending: (orders ?? []).filter((order) => order.status === 'pending')
      .length,
    preparing: (orders ?? []).filter((order) => order.status === 'preparing')
      .length,
    delivered: (orders ?? []).filter((order) => order.status === 'delivered')
      .length,
  };
  return NextResponse.json({ stats, orders });
}
