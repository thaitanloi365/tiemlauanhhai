import { NextResponse, type NextRequest } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  getAdminByUserId,
  type AdminUser,
} from '@/lib/server/admin-auth';
import { isIpBlocked, recordRateLimitViolation } from '@/lib/server/ip-block';
import { consumeIpRateLimit } from '@/lib/server/rate-limit';
import {
  applySecurityHeaders,
  extractClientIp,
  validatePublicApiBodySize,
  validateSameOriginForApiWrites,
} from '@/lib/server/security';
import { logPromotionSecurityEvent } from '@/lib/server/promotion-security-log';
import { createServerSupabase, hasSupabaseConfig } from '@/lib/supabase/server';

const PUBLIC_ADMIN_PAGES = new Set(['/admin/login']);
const PUBLIC_ADMIN_APIS = new Set([
  '/api/admin/auth/login',
  '/api/admin/auth/logout',
]);

function isAdminPage(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isAdminApi(pathname: string) {
  return pathname.startsWith('/api/admin/');
}

function isPublicAdminRoute(pathname: string) {
  return PUBLIC_ADMIN_PAGES.has(pathname) || PUBLIC_ADMIN_APIS.has(pathname);
}

function rejectUnauthorized(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (isAdminApi(pathname)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.redirect(new URL('/admin/login', request.url), 303);
}

async function validateAdminToken(token: string): Promise<AdminUser | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return getAdminByUserId(data.user.id);
}

function withRateLimitHeaders(
  response: NextResponse,
  rateLimit: ReturnType<typeof consumeIpRateLimit>,
) {
  if (!rateLimit) return response;
  response.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
  response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
  response.headers.set(
    'X-RateLimit-Reset',
    String(Math.floor(rateLimit.resetAt / 1000)),
  );
  return response;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const clientIp = extractClientIp(request);

  const blocked = await isIpBlocked(clientIp);
  if (blocked.blocked) {
    const response = NextResponse.json(
      { message: blocked.reason ?? 'IP blocked' },
      {
        status: 403,
      },
    );
    return applySecurityHeaders(response);
  }

  const rateLimit = consumeIpRateLimit({
    ip: clientIp || 'unknown',
    pathname,
    method: request.method,
  });
  if (rateLimit && !rateLimit.ok) {
    await recordRateLimitViolation(clientIp);
    if (pathname === '/api/promotions/validate') {
      await logPromotionSecurityEvent({
        eventType: 'promotion_validate_rate_limited',
        ipAddress: clientIp || null,
        reason: 'Too many promotion validate requests',
        metadata: {
          limit: rateLimit.limit,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
      });
    }
    const response = NextResponse.json(
      { message: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      },
    );
    withRateLimitHeaders(response, rateLimit);
    return applySecurityHeaders(response);
  }

  const originErrorResponse = validateSameOriginForApiWrites(request);
  if (originErrorResponse) {
    withRateLimitHeaders(originErrorResponse, rateLimit);
    return applySecurityHeaders(originErrorResponse);
  }

  const bodySizeErrorResponse = validatePublicApiBodySize(request);
  if (bodySizeErrorResponse) {
    withRateLimitHeaders(bodySizeErrorResponse, rateLimit);
    return applySecurityHeaders(bodySizeErrorResponse);
  }

  const response = NextResponse.next();
  const isAdminRoute = isAdminPage(pathname) || isAdminApi(pathname);
  if (isAdminRoute) {
    if (!hasSupabaseConfig()) {
      if (isPublicAdminRoute(pathname)) {
        withRateLimitHeaders(response, rateLimit);
        return applySecurityHeaders(response);
      }

      if (isAdminApi(pathname)) {
        const unavailable = NextResponse.json(
          { message: 'Thiếu cấu hình Supabase cho khu vực admin' },
          { status: 503 },
        );
        withRateLimitHeaders(unavailable, rateLimit);
        return applySecurityHeaders(unavailable);
      }

      const redirect = NextResponse.redirect(
        new URL('/admin/login', request.url),
        303,
      );
      withRateLimitHeaders(redirect, rateLimit);
      return applySecurityHeaders(redirect);
    }

    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const adminUser = token ? await validateAdminToken(token) : null;

    if (pathname === '/admin/login' && adminUser) {
      const redirect = NextResponse.redirect(
        new URL('/admin', request.url),
        303,
      );
      withRateLimitHeaders(redirect, rateLimit);
      return applySecurityHeaders(redirect);
    }

    if (!isPublicAdminRoute(pathname) && !adminUser) {
      const unauthorized = rejectUnauthorized(request);
      withRateLimitHeaders(unauthorized, rateLimit);
      return applySecurityHeaders(unauthorized);
    }

    if (adminUser) {
      response.headers.set('x-admin-user-id', adminUser.id);
      response.headers.set('x-admin-user-role', adminUser.role);
    }
  }

  withRateLimitHeaders(response, rateLimit);
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|favicon.svg).*)'],
};
