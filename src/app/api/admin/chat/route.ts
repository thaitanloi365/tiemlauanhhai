import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { resolveAdminUserFromRequest } from '@/lib/server/next-admin';

type LatestMessageRow = Pick<
  AppTypes.OrderMessage,
  'id' | 'order_id' | 'sender_type' | 'content' | 'images' | 'created_at'
>;

export async function GET(request: NextRequest) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ conversations: [] });
  }

  const supabase = createServerSupabase();
  const orderIdFilter = request.nextUrl.searchParams.get('oid')?.trim();
  let messageRequest = supabase
    .from('order_messages')
    .select('id,order_id,sender_type,content,images,created_at')
    .order('created_at', { ascending: false })
    .limit(1000);
  if (orderIdFilter) {
    messageRequest = messageRequest.eq('order_id', orderIdFilter);
  }
  const { data: messageRows, error: messageError } = await messageRequest;

  if (messageError) {
    return NextResponse.json({ message: messageError.message }, { status: 500 });
  }

  const latestByOrder = new Map<string, LatestMessageRow>();
  const countByOrder = new Map<string, number>();
  const latestCustomerMessageByOrder = new Map<string, string>();
  for (const rawRow of (messageRows ?? []) as LatestMessageRow[]) {
    countByOrder.set(rawRow.order_id, (countByOrder.get(rawRow.order_id) ?? 0) + 1);
    if (!latestByOrder.has(rawRow.order_id)) {
      latestByOrder.set(rawRow.order_id, rawRow);
    }
    if (rawRow.sender_type === 'customer' && !latestCustomerMessageByOrder.has(rawRow.order_id)) {
      latestCustomerMessageByOrder.set(rawRow.order_id, rawRow.created_at);
    }
  }

  const orderIds = [...latestByOrder.keys()];
  if (orderIds.length === 0) {
    return NextResponse.json({ conversations: [] });
  }

  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select(
      'id,customer_name,phone,address,province,district,ward,total_amount,discount_amount,status,created_at,admin_last_seen_message_at',
    )
    .in('id', orderIds);
  if (orderError) {
    return NextResponse.json({ message: orderError.message }, { status: 500 });
  }

  const conversations = (orders ?? [])
    .map((order) => {
      const latest_message = latestByOrder.get(order.id as string);
      if (!latest_message) return null;
      const latestCustomerMessageAt = latestCustomerMessageByOrder.get(order.id as string);
      const adminLastSeen = order.admin_last_seen_message_at as string | null;
      return {
        order,
        latest_message,
        message_count: countByOrder.get(order.id as string) ?? 0,
        has_unread_for_admin: Boolean(
          latestCustomerMessageAt &&
            (!adminLastSeen ||
              new Date(latestCustomerMessageAt).getTime() >
                new Date(adminLastSeen).getTime()),
        ),
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      (b!.latest_message.created_at ?? '').localeCompare(a!.latest_message.created_at ?? ''),
    );

  return NextResponse.json({ conversations });
}
