import { cookies } from 'next/headers';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import {
  ADMIN_COOKIE_NAME,
  getAdminByUserId,
  type AdminUser,
} from '@/lib/server/admin-auth';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/server/supabase';

async function resolveAdminUserFromCookie(): Promise<AdminUser | null> {
  if (!hasSupabaseConfig()) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;

  const supabase = createServerSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return getAdminByUserId(data.user.id);
}

export default async function AdminLayout({ children }: { children: any }) {
  const adminUser = await resolveAdminUserFromCookie();
  return (
    <AdminSidebar
      adminEmail={adminUser?.email ?? 'Admin'}
      adminRole={adminUser?.role ?? 'manager'}
    >
      {children}
    </AdminSidebar>
  );
}
