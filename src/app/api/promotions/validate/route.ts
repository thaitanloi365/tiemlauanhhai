import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import {
  getPromotionByCode,
  normalizePromotionCode,
  validatePromotionForOrder,
} from '@/lib/server/promotion';
import { logPromotionSecurityEvent } from '@/lib/server/promotion-security-log';
import { extractClientIp } from '@/lib/server/security';
import { promotionValidateSchema } from '@/lib/utils/validation';

export async function POST(request: NextRequest) {
  const clientIp = extractClientIp(request);
  const payload = await request.json().catch(() => null);
  const parsed = promotionValidateSchema.safeParse(payload);
  if (!parsed.success) {
    await logPromotionSecurityEvent({
      eventType: 'promotion_validate_failed',
      ipAddress: clientIp || null,
      reason: 'Invalid payload',
    });
    return NextResponse.json(
      {
        valid: false,
        message: parsed.error.issues[0]?.message ?? 'Payload không hợp lệ',
      },
      { status: 400 },
    );
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      {
        valid: false,
        message: 'Môi trường hiện tại không hỗ trợ mã khuyến mãi.',
      },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const promotion = await getPromotionByCode(supabase, parsed.data.code);
  const result = validatePromotionForOrder(promotion, parsed.data.order_amount);
  if (!result.ok) {
    await logPromotionSecurityEvent({
      eventType: 'promotion_validate_failed',
      promotionCode: normalizePromotionCode(parsed.data.code),
      ipAddress: clientIp || null,
      reason: result.message,
    });
    return NextResponse.json(
      {
        valid: false,
        code: normalizePromotionCode(parsed.data.code),
        message: 'Mã khuyến mãi không hợp lệ hoặc không khả dụng.',
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    valid: true,
    code: result.promotion.code,
    discountAmount: result.discountAmount,
    type: result.promotion.type,
    message: 'Áp dụng mã khuyến mãi thành công.',
  });
}
