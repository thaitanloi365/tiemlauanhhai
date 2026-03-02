import { createServerSupabase } from '@/lib/supabase/server';

export const ADMIN_ROLE = 'super_admin';
export const ADMIN_ROLES = ['super_admin', 'manager'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];
export const ADMIN_COOKIE_NAME = 'admin_token';
export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 2,
  manager: 1,
};

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  display_name?: string | null;
}

export async function getAdminByUserId(
  userId: string,
): Promise<AdminUser | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('admin_users')
    .select('id,email,role,display_name')
    .eq('id', userId)
    .in('role', ADMIN_ROLES)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export function canManageRole(
  actorRole: AdminRole,
  targetRole: AdminRole,
): boolean {
  return ROLE_HIERARCHY[actorRole] >= ROLE_HIERARCHY[targetRole];
}
