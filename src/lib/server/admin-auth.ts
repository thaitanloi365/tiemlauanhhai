import { createServerSupabase } from '$lib/server/supabase';

export const ADMIN_ROLE = 'super_admin';
export const ADMIN_COOKIE_NAME = 'admin_token';

export interface AdminUser {
	id: string;
	email: string;
	role: string;
}

export async function getAdminByUserId(userId: string): Promise<AdminUser | null> {
	const supabase = createServerSupabase();
	const { data, error } = await supabase
		.from('admin_users')
		.select('id,email,role')
		.eq('id', userId)
		.eq('role', ADMIN_ROLE)
		.maybeSingle();
	if (error || !data) return null;
	return data;
}
