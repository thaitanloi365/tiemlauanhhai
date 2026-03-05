import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { uploadChatImages, validateChatImageFiles } from '@/lib/server/chat-media';
import { isChatReadonlyByOrderStatus } from '@/lib/constants/chat';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const sessionSchema = z.string().uuid('Session không hợp lệ');

async function getOrderById(orderId: string) {
  const supabase = createServerSupabase();
  const { data: order, error } = await supabase
    .from('orders')
    .select('id,session_id,status')
    .eq('id', orderId)
    .single();
  if (error || !order) return null;
  return order;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { message: 'Chat chỉ hoạt động khi có cấu hình Supabase' },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const sessionIdRaw = formData.get('sessionId');
  const sessionIdParsed = sessionSchema.safeParse(sessionIdRaw);
  if (!sessionIdParsed.success) {
    return NextResponse.json({ message: 'Session không hợp lệ' }, { status: 400 });
  }

  const files = formData
    .getAll('files')
    .filter((value): value is File => value instanceof File);
  const validationMessage = validateChatImageFiles(files);
  if (validationMessage) {
    return NextResponse.json({ message: validationMessage }, { status: 400 });
  }

  const order = await getOrderById(params.id);
  if (!order) {
    return NextResponse.json({ message: 'Không tìm thấy đơn hàng' }, { status: 404 });
  }
  if (order.session_id !== sessionIdParsed.data) {
    return NextResponse.json({ message: 'Không có quyền upload hình ảnh' }, { status: 403 });
  }
  if (isChatReadonlyByOrderStatus(order.status)) {
    return NextResponse.json(
      { message: 'Đơn hàng đã hoàn tất, chat chỉ còn chế độ xem' },
      { status: 400 },
    );
  }

  try {
    const urls = await uploadChatImages(params.id, files);
    return NextResponse.json({ urls });
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message || 'Upload thất bại' },
      { status: 500 },
    );
  }
}
