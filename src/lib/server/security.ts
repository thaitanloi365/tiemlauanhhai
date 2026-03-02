import { NextResponse, type NextRequest } from 'next/server';
import { sanitizeIp } from '@/lib/server/ip-block';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const BODY_SIZE_LIMITED_ROUTES = new Set(['/api/orders', '/api/reviews']);
const MAX_PUBLIC_API_BODY_BYTES = 100 * 1024;

export function extractClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return sanitizeIp(forwardedFor.split(',')[0] ?? '');
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return sanitizeIp(realIp);
  }

  return sanitizeIp(request.headers.get('cf-connecting-ip') ?? '');
}

function isApiWriteRequest(pathname: string, method: string) {
  return (
    pathname.startsWith('/api/') && WRITE_METHODS.has(method.toUpperCase())
  );
}

export function validateSameOriginForApiWrites(request: NextRequest) {
  const method = request.method.toUpperCase();
  const pathname = request.nextUrl.pathname;

  if (!isApiWriteRequest(pathname, method)) return null;

  const originHeader = request.headers.get('origin');
  if (!originHeader) {
    return NextResponse.json(
      { message: 'Origin header is required' },
      { status: 403 },
    );
  }

  if (originHeader !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: 'Invalid request origin' },
      { status: 403 },
    );
  }

  return null;
}

export function validatePublicApiBodySize(request: NextRequest) {
  const method = request.method.toUpperCase();
  const pathname = request.nextUrl.pathname;
  if (!WRITE_METHODS.has(method) || !BODY_SIZE_LIMITED_ROUTES.has(pathname))
    return null;

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_PUBLIC_API_BODY_BYTES
  ) {
    return NextResponse.json(
      { message: 'Payload is too large' },
      { status: 413 },
    );
  }

  return null;
}

export function applySecurityHeaders(response: Response) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );
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
      "connect-src 'self' https://*.supabase.co https://vitals.vercel-insights.com https://va.vercel-scripts.com",
    ].join('; '),
  );

  return response;
}
