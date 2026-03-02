import { json, type RequestEvent } from '@sveltejs/kit';
import { sanitizeIp } from '$lib/server/ip-block';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const BODY_SIZE_LIMITED_ROUTES = new Set(['/api/orders', '/api/reviews']);
const MAX_PUBLIC_API_BODY_BYTES = 100 * 1024;

export function extractClientIp(event: RequestEvent) {
	const forwardedFor = event.request.headers.get('x-forwarded-for');
	if (forwardedFor) {
		return sanitizeIp(forwardedFor.split(',')[0] ?? '');
	}

	const realIp = event.request.headers.get('x-real-ip');
	if (realIp) {
		return sanitizeIp(realIp);
	}

	try {
		return sanitizeIp(event.getClientAddress());
	} catch {
		return '';
	}
}

function isApiWriteRequest(pathname: string, method: string) {
	return pathname.startsWith('/api/') && WRITE_METHODS.has(method.toUpperCase());
}

export function validateSameOriginForApiWrites(event: RequestEvent) {
	const method = event.request.method.toUpperCase();
	const pathname = event.url.pathname;

	if (!isApiWriteRequest(pathname, method)) return null;

	const originHeader = event.request.headers.get('origin');
	if (!originHeader) {
		return json({ message: 'Origin header is required' }, { status: 403 });
	}

	if (originHeader !== event.url.origin) {
		return json({ message: 'Invalid request origin' }, { status: 403 });
	}

	return null;
}

export function validatePublicApiBodySize(event: RequestEvent) {
	const method = event.request.method.toUpperCase();
	const pathname = event.url.pathname;
	if (!WRITE_METHODS.has(method) || !BODY_SIZE_LIMITED_ROUTES.has(pathname)) return null;

	const contentLength = Number(event.request.headers.get('content-length') ?? '0');
	if (Number.isFinite(contentLength) && contentLength > MAX_PUBLIC_API_BODY_BYTES) {
		return json({ message: 'Payload is too large' }, { status: 413 });
	}

	return null;
}

export function applySecurityHeaders(response: Response) {
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"base-uri 'self'",
			"form-action 'self'",
			"frame-ancestors 'none'",
			"img-src 'self' data: https:",
			"style-src 'self' 'unsafe-inline'",
			"script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
			"connect-src 'self' https://*.supabase.co https://vitals.vercel-insights.com https://va.vercel-scripts.com"
		].join('; ')
	);

	return response;
}
