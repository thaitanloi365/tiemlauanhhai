import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { subscriberSchema } from '@/lib/utils/validation';

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const parsed = subscriberSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' },
      { status: 400 },
    );
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json({
      message: 'Đã ghi nhận đăng ký nhận thông báo.',
    });
  }

  const body = parsed.data;
  const supabase = createServerSupabase();
  const { error } = await supabase.from('area_subscribers').upsert(
    {
      email: body.email,
      province: body.province,
      district: body.district ?? null,
    },
    { onConflict: 'email,province' },
  );
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Đã ghi nhận đăng ký nhận thông báo.' });
}
