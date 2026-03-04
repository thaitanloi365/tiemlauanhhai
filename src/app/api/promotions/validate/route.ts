import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import {
  getPromotionByCode,
  normalizePromotionCode,
  validatePromotionForOrder,
} from '@/lib/server/promotion';
import { promotionValidateSchema } from '@/lib/utils/validation';

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const parsed = promotionValidateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { valid: false, message: parsed.error.issues[0]?.message ?? 'Payload không hợp lệ' },
      { status: 400 },
    );
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { valid: false, message: 'Môi trường hiện tại không hỗ trợ mã khuyến mãi.' },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const promotion = await getPromotionByCode(supabase, parsed.data.code);
  const result = validatePromotionForOrder(promotion, parsed.data.order_amount);
  if (!result.ok) {
    return NextResponse.json(
      { valid: false, code: normalizePromotionCode(parsed.data.code), message: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({
    valid: true,
    code: result.promotion.code,
    promotion: result.promotion,
    discountAmount: result.discountAmount,
    message: 'Áp dụng mã khuyến mãi thành công.',
  });
}
