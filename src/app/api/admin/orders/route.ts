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
    return NextResponse.json({
      stats,
      orders: orders.map((order) => ({
        ...order,
        has_review: false,
        has_chat: false,
        has_unread_for_admin: false,
      })),
    });
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

  const orderIds = (orders ?? []).map((order) => order.id as string);
  const hasReviewSet = new Set<string>();
  const latestCustomerMessageByOrder = new Map<string, string>();
  const hasChatSet = new Set<string>();
  if (orderIds.length > 0) {
    const [{ data: reviews }, { data: messages }] = await Promise.all([
      supabase.from('reviews').select('order_id').in('order_id', orderIds),
      supabase
        .from('order_messages')
        .select('order_id,sender_type,created_at')
        .in('order_id', orderIds)
        .order('created_at', { ascending: false }),
    ]);

    for (const review of reviews ?? []) {
      hasReviewSet.add(review.order_id as string);
    }
    for (const message of messages ?? []) {
      const orderId = message.order_id as string;
      hasChatSet.add(orderId);
      if (
        message.sender_type === 'customer' &&
        !latestCustomerMessageByOrder.has(orderId)
      ) {
        latestCustomerMessageByOrder.set(orderId, message.created_at as string);
      }
    }
  }

  const stats = {
    total: orders?.length ?? 0,
    pending: (orders ?? []).filter((order) => order.status === 'pending')
      .length,
    preparing: (orders ?? []).filter((order) => order.status === 'preparing')
      .length,
    delivered: (orders ?? []).filter((order) => order.status === 'delivered')
      .length,
  };
  return NextResponse.json({
    stats,
    orders: (orders ?? []).map((order) => {
      const latestCustomerMessageAt = latestCustomerMessageByOrder.get(order.id as string);
      const adminLastSeen = order.admin_last_seen_message_at as string | null;
      const hasUnreadForAdmin = Boolean(
        latestCustomerMessageAt &&
          (!adminLastSeen ||
            new Date(latestCustomerMessageAt).getTime() >
              new Date(adminLastSeen).getTime()),
      );
      return {
        ...order,
        has_review: hasReviewSet.has(order.id as string),
        has_chat: hasChatSet.has(order.id as string),
        has_unread_for_admin: hasUnreadForAdmin,
      };
    }),
  });
}
