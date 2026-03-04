import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { resolveAdminUserFromRequest } from '@/lib/server/next-admin';
import { normalizePromotionCode } from '@/lib/server/promotion';
import { promotionSchema } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ promotions: [] });
  }

  const q = request.nextUrl.searchParams.get('q')?.trim();
  const type = request.nextUrl.searchParams.get('type')?.trim();

  const supabase = createServerSupabase();
  let query = supabase
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false });

  if (q) query = query.ilike('code', `%${q}%`);
  if (type === 'fixed_amount' || type === 'percentage') {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ promotions: data ?? [] });
}

export async function POST(request: NextRequest) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { message: 'Supabase chưa được cấu hình.' },
      { status: 400 },
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = promotionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Payload không hợp lệ' },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const insertPayload = {
    code: normalizePromotionCode(parsed.data.code),
    type: parsed.data.type,
    discount_value: parsed.data.discount_value,
    max_discount_amount: parsed.data.max_discount_amount ?? null,
    min_order_amount: parsed.data.min_order_amount,
    max_usage: parsed.data.max_usage ?? null,
    valid_from: parsed.data.valid_from,
    valid_until: parsed.data.valid_until,
    is_active: parsed.data.is_active ?? true,
    created_by: adminUser.id,
  };

  const { data, error } = await supabase
    .from('promotions')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    const message =
      error.code === '23505'
        ? 'Mã khuyến mãi đã tồn tại.'
        : error.message ?? 'Không thể tạo mã khuyến mãi.';
    return NextResponse.json({ message }, { status: 400 });
  }
  return NextResponse.json({ promotion: data }, { status: 201 });
}
