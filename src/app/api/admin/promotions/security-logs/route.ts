import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';
import { resolveAdminUserFromRequest } from '@/lib/server/next-admin';

export async function GET(request: NextRequest) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json({ logs: [] });
  }

  const eventType = request.nextUrl.searchParams.get('eventType')?.trim();
  const q = request.nextUrl.searchParams.get('q')?.trim();

  const supabase = createServerSupabase();
  let query = supabase
    .from('promotion_security_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (eventType) query = query.eq('event_type', eventType);
  if (q) {
    query = query.or(
      `promotion_code.ilike.%${q}%,ip_address.ilike.%${q}%,reason.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data ?? [] });
}
