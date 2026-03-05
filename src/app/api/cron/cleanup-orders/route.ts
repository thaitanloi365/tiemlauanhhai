import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { ORDER_TIME } from '@/lib/constants/order';
import { now as dayjsNow } from '@/lib/date';
import { deleteChatStorageFiles } from '@/lib/server/chat-media';

function isAuthorized(request: NextRequest, secret: string | undefined) {
  if (!secret) return false;
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request, process.env.CRON_SECRET)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json({
      ok: true,
      markedExpiredCount: 0,
      deletedExpiredCount: 0,
      message: 'Supabase chưa được cấu hình, bỏ qua cron cleanup.',
    });
  }

  const now = dayjsNow();
  const nowIso = now.toISOString();
  const expireCutoffIso = now
    .subtract(ORDER_TIME.EXPIRE_AFTER_MS, 'millisecond')
    .toISOString();
  const deleteCutoffIso = now
    .subtract(ORDER_TIME.DELETE_AFTER_EXPIRED_MS, 'millisecond')
    .toISOString();
  const supabase = createServerSupabase();

  const { data: markedRows, error: markError } = await supabase
    .from('orders')
    .update({
      expired_at: nowIso,
      updated_at: nowIso,
    })
    .eq('status', 'pending')
    .is('expired_at', null)
    .lt('created_at', expireCutoffIso)
    .select('id');

  if (markError)
    return NextResponse.json({ message: markError.message }, { status: 500 });

  const markedOrderIds = (markedRows ?? []).map((row) => row.id as string);
  if (markedOrderIds.length > 0) {
    const logs = markedOrderIds.map((orderId) => ({
      order_id: orderId,
      status: 'pending' as const,
      note: 'Đơn hàng đã quá 24 giờ ở trạng thái chờ xác nhận.',
    }));
    const { error: logError } = await supabase
      .from('order_status_logs')
      .insert(logs);
    if (logError)
      return NextResponse.json({ message: logError.message }, { status: 500 });
  }

  const { data: candidateRows, error: candidateError } = await supabase
    .from('orders')
    .select('id')
    .lt('expired_at', deleteCutoffIso);
  if (candidateError) {
    return NextResponse.json({ message: candidateError.message }, { status: 500 });
  }

  const candidateOrderIds = (candidateRows ?? []).map((row) => row.id as string);
  if (candidateOrderIds.length > 0) {
    const { data: messageRows, error: messageError } = await supabase
      .from('order_messages')
      .select('images')
      .in('order_id', candidateOrderIds);
    if (messageError) {
      return NextResponse.json({ message: messageError.message }, { status: 500 });
    }

    const urlsToDelete = (messageRows ?? []).flatMap((row) => {
      const images = row.images;
      return Array.isArray(images)
        ? images.filter((url): url is string => typeof url === 'string' && url.length > 0)
        : [];
    });
    await deleteChatStorageFiles(urlsToDelete);
  }

  let deletedRows: { id: string }[] = [];
  let deleteError: { message: string } | null = null;
  if (candidateOrderIds.length > 0) {
    const deleteResult = await supabase
      .from('orders')
      .delete()
      .in('id', candidateOrderIds)
      .select('id');
    deletedRows = (deleteResult.data ?? []) as { id: string }[];
    deleteError = deleteResult.error;
  }

  if (deleteError)
    return NextResponse.json({ message: deleteError.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    markedExpiredCount: markedOrderIds.length,
    deletedExpiredCount: (deletedRows ?? []).length,
  });
}
