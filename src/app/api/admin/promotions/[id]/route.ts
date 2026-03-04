import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { resolveAdminUserFromRequest } from '@/lib/server/next-admin';
import { promotionUpdateSchema } from '@/lib/utils/validation';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const params = await context.params;
  if (!params.id) {
    return NextResponse.json({ message: 'Thiếu mã khuyến mãi' }, { status: 400 });
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const supabase = createServerSupabase();
  const [{ data: promotion, error }, { count: usageCount }] = await Promise.all([
    supabase.from('promotions').select('*').eq('id', params.id).maybeSingle(),
    supabase
      .from('promotion_usages')
      .select('*', { head: true, count: 'exact' })
      .eq('promotion_id', params.id),
  ]);

  if (error || !promotion) {
    return NextResponse.json({ message: 'Không tìm thấy mã khuyến mãi.' }, { status: 404 });
  }
  return NextResponse.json({
    promotion,
    stats: {
      totalUsageRecords: usageCount ?? 0,
    },
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const params = await context.params;
  if (!params.id) {
    return NextResponse.json({ message: 'Thiếu mã khuyến mãi' }, { status: 400 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ message: 'Supabase chưa được cấu hình.' }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = promotionUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Payload không hợp lệ' },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.discount_value !== undefined) {
    updates.discount_value = parsed.data.discount_value;
  }
  if (parsed.data.max_discount_amount !== undefined) {
    updates.max_discount_amount = parsed.data.max_discount_amount;
  }
  if (parsed.data.min_order_amount !== undefined) {
    updates.min_order_amount = parsed.data.min_order_amount;
  }
  if (parsed.data.max_usage !== undefined) updates.max_usage = parsed.data.max_usage;
  if (parsed.data.valid_from !== undefined) updates.valid_from = parsed.data.valid_from;
  if (parsed.data.valid_until !== undefined) updates.valid_until = parsed.data.valid_until;
  if (parsed.data.is_active !== undefined) updates.is_active = parsed.data.is_active;

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('promotions')
    .update(updates)
    .eq('id', params.id)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { message: error?.message ?? 'Không thể cập nhật mã khuyến mãi.' },
      { status: 400 },
    );
  }
  return NextResponse.json({ promotion: data });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const params = await context.params;
  if (!params.id) {
    return NextResponse.json({ message: 'Thiếu mã khuyến mãi' }, { status: 400 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ message: 'Supabase chưa được cấu hình.' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { count, error: usageError } = await supabase
    .from('promotion_usages')
    .select('*', { head: true, count: 'exact' })
    .eq('promotion_id', params.id);
  if (usageError) {
    return NextResponse.json({ message: usageError.message }, { status: 500 });
  }

  if ((count ?? 0) > 0) {
    const { error } = await supabase
      .from('promotions')
      .update({ is_active: false })
      .eq('id', params.id);
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, softDeleted: true });
  }

  const { error } = await supabase.from('promotions').delete().eq('id', params.id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, softDeleted: false });
}
