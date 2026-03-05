import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { resolveAdminUserFromRequest } from '@/lib/server/next-admin';
import { uploadChatImages, validateChatImageFiles } from '@/lib/server/chat-media';
import { isChatReadonlyByOrderStatus } from '@/lib/constants/chat';

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getOrderById(orderId: string) {
  const supabase = createServerSupabase();
  const { data: order, error } = await supabase
    .from('orders')
    .select('id,status')
    .eq('id', orderId)
    .single();
  if (error || !order) return null;
  return order;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { message: 'Chat chỉ hoạt động khi có cấu hình Supabase' },
      { status: 400 },
    );
  }

  const formData = await request.formData();
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
