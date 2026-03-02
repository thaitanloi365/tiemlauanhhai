import { json, redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { ADMIN_COOKIE_NAME, getAdminByUserId, type AdminUser } from '$lib/server/admin-auth';
import { isIpBlocked, recordRateLimitViolation } from '$lib/server/ip-block';
import { consumeIpRateLimit } from '$lib/server/rate-limit';
import {
	applySecurityHeaders,
	extractClientIp,
	validatePublicApiBodySize,
	validateSameOriginForApiWrites
} from '$lib/server/security';
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

const securityHandle: Handle = async ({ event, resolve }) => {
	const clientIp = extractClientIp(event);
	event.locals.clientIp = clientIp;

	const blocked = await isIpBlocked(clientIp);
	if (blocked.blocked) {
		return json(
			{ message: blocked.reason ?? 'IP blocked' },
			{
				status: 403
			}
		);
	}

	const rateLimit = consumeIpRateLimit({
		ip: clientIp || 'unknown',
		pathname: event.url.pathname,
		method: event.request.method
	});
	if (rateLimit && !rateLimit.ok) {
		await recordRateLimitViolation(clientIp);
		return json(
			{ message: 'Too many requests' },
			{
				status: 429,
				headers: {
					'Retry-After': String(rateLimit.retryAfterSeconds),
					'X-RateLimit-Limit': String(rateLimit.limit),
					'X-RateLimit-Remaining': String(rateLimit.remaining),
					'X-RateLimit-Reset': String(Math.floor(rateLimit.resetAt / 1000))
				}
			}
		);
	}

	const originErrorResponse = validateSameOriginForApiWrites(event);
	if (originErrorResponse) {
		return originErrorResponse;
	}

	const bodySizeErrorResponse = validatePublicApiBodySize(event);
	if (bodySizeErrorResponse) {
		return bodySizeErrorResponse;
	}

	const response = await resolve(event);
	if (rateLimit) {
		response.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
		response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
		response.headers.set('X-RateLimit-Reset', String(Math.floor(rateLimit.resetAt / 1000)));
	}
	return applySecurityHeaders(response);
};

const adminAuthHandle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;
	const isAdminRoute = isAdminPage(pathname) || isAdminApi(pathname);
	if (!isAdminRoute) return resolve(event);

	if (!hasSupabaseConfig()) {
		if (isPublicAdminRoute(pathname)) return resolve(event);
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

export const handle = sequence(securityHandle, adminAuthHandle);
