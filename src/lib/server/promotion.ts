import type { SupabaseClient } from '@supabase/supabase-js';
import type { Promotion } from '@/lib/types';

export type PromotionValidationResult =
  | { ok: true; promotion: Promotion; discountAmount: number }
  | { ok: false; message: string };

export function normalizePromotionCode(code: string) {
  return code.trim().toUpperCase();
}

export function calculatePromotionDiscount(
  promotion: Pick<Promotion, 'type' | 'discount_value' | 'max_discount_amount'>,
  orderAmount: number,
) {
  if (orderAmount <= 0) return 0;
  if (promotion.type === 'fixed_amount') {
    return Math.max(0, Math.min(orderAmount, promotion.discount_value));
  }
  const raw = Math.floor((orderAmount * promotion.discount_value) / 100);
  const capped = Math.min(raw, promotion.max_discount_amount ?? raw);
  return Math.max(0, Math.min(orderAmount, capped));
}

export function validatePromotionForOrder(
  promotion: Promotion | null,
  orderAmount: number,
  now: Date = new Date(),
): PromotionValidationResult {
  if (!promotion) {
    return { ok: false, message: 'Mã khuyến mãi không tồn tại.' };
  }
  if (!promotion.is_active) {
    return { ok: false, message: 'Mã khuyến mãi đã bị khóa.' };
  }
  const nowMs = now.getTime();
  if (new Date(promotion.valid_from).getTime() > nowMs) {
    return { ok: false, message: 'Mã khuyến mãi chưa đến thời gian sử dụng.' };
  }
  if (new Date(promotion.valid_until).getTime() < nowMs) {
    return { ok: false, message: 'Mã khuyến mãi đã hết hạn.' };
  }
  if (orderAmount < promotion.min_order_amount) {
    return {
      ok: false,
      message: `Đơn hàng tối thiểu ${promotion.min_order_amount.toLocaleString('vi-VN')}đ mới áp dụng được mã này.`,
    };
  }
  if (
    promotion.max_usage !== null &&
    promotion.used_count >= promotion.max_usage
  ) {
    return { ok: false, message: 'Mã khuyến mãi đã hết lượt sử dụng.' };
  }
  const discountAmount = calculatePromotionDiscount(promotion, orderAmount);
  if (discountAmount <= 0) {
    return { ok: false, message: 'Mã khuyến mãi không áp dụng cho đơn này.' };
  }
  return { ok: true, promotion, discountAmount };
}

export async function getPromotionByCode(
  supabase: SupabaseClient,
  rawCode: string,
): Promise<Promotion | null> {
  const code = normalizePromotionCode(rawCode);
  const { data } = await supabase
    .from('promotions')
    .select('*')
    .eq('code', code)
    .maybeSingle();
  return (data as Promotion | null) ?? null;
}
