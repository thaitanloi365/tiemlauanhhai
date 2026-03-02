import type { NextRequest } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  getAdminByUserId,
  type AdminUser,
} from '@/lib/server/admin-auth';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';

export async function resolveAdminUserFromRequest(
  request: NextRequest,
): Promise<AdminUser | null> {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !hasSupabaseConfig()) return null;

  const supabase = createServerSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return getAdminByUserId(data.user.id);
}
