import { json, redirect, type Handle } from '@sveltejs/kit';
import { ADMIN_COOKIE_NAME, getAdminByUserId, type AdminUser } from '$lib/server/admin-auth';
import { createServerSupabase, hasSupabaseConfig } from '$lib/server/supabase';

const PUBLIC_ADMIN_PAGES = new Set(['/admin/login']);
const PUBLIC_ADMIN_APIS = new Set(['/api/admin/auth/login', '/api/admin/auth/logout']);

function isAdminPage(pathname: string) {
	return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isAdminApi(pathname: string) {
	return pathname.startsWith('/api/admin/');
}

function isPublicAdminRoute(pathname: string) {
	return PUBLIC_ADMIN_PAGES.has(pathname) || PUBLIC_ADMIN_APIS.has(pathname);
}

function rejectUnauthorized(pathname: string) {
	if (isAdminApi(pathname)) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}
	throw redirect(303, '/admin/login');
}

async function validateAdminToken(token: string): Promise<AdminUser | null> {
	const supabase = createServerSupabase();
	const { data, error } = await supabase.auth.getUser(token);
	if (error || !data.user) return null;
	return getAdminByUserId(data.user.id);
}

export const handle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;
	const isAdminRoute = isAdminPage(pathname) || isAdminApi(pathname);

	if (!isAdminRoute) {
		return resolve(event);
	}

	if (!hasSupabaseConfig()) {
		if (isPublicAdminRoute(pathname)) {
			return resolve(event);
		}
		if (isAdminApi(pathname)) {
			return json({ message: 'Thiếu cấu hình Supabase cho khu vực admin' }, { status: 503 });
		}
		throw redirect(303, '/admin/login');
	}

	const token = event.cookies.get(ADMIN_COOKIE_NAME);
	const adminUser = token ? await validateAdminToken(token) : null;

	if (pathname === '/admin/login' && adminUser) {
		throw redirect(303, '/admin');
	}

	if (isPublicAdminRoute(pathname)) {
		return resolve(event);
	}

	if (!adminUser) {
		return rejectUnauthorized(pathname);
	}

	event.locals.adminUser = adminUser;
	return resolve(event);
};
