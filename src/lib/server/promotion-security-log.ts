import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';

type PromotionSecurityEvent = {
  eventType:
    | 'promotion_validate_failed'
    | 'promotion_validate_rate_limited'
    | 'promotion_consume_failed'
    | 'promotion_release_failed';
  promotionCode?: string | null;
  ipAddress?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logPromotionSecurityEvent(input: PromotionSecurityEvent) {
  if (!hasSupabaseConfig()) return;
  const supabase = createServerSupabase();
  await supabase.from('promotion_security_logs').insert({
    event_type: input.eventType,
    promotion_code: input.promotionCode ?? null,
    ip_address: input.ipAddress ?? null,
    reason: input.reason ?? null,
    metadata: input.metadata ?? {},
  });
}
