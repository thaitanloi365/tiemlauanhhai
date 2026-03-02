type RateLimitRule = {
  limit: number;
  windowMs: number;
  keyPrefix: string;
};

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  limit: number;
  retryAfterSeconds: number;
  resetAt: number;
};

const hitsByKey = new Map<string, number[]>();
let lastCleanupAt = 0;

const RULES = {
  ordersPost: { limit: 5, windowMs: 15 * 60 * 1000, keyPrefix: 'orders:post' },
  reviewsPost: {
    limit: 5,
    windowMs: 15 * 60 * 1000,
    keyPrefix: 'reviews:post',
  },
  adminLoginPost: {
    limit: 5,
    windowMs: 15 * 60 * 1000,
    keyPrefix: 'admin-login:post',
  },
  apiGet: { limit: 60, windowMs: 60 * 1000, keyPrefix: 'api:get' },
  generalPage: { limit: 120, windowMs: 60 * 1000, keyPrefix: 'page:any' },
} satisfies Record<string, RateLimitRule>;

function shouldBypass(pathname: string) {
  return (
    pathname.startsWith('/_app/') ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon.svg' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  );
}

function resolveRule(pathname: string, method: string): RateLimitRule | null {
  if (shouldBypass(pathname)) return null;

  if (method === 'POST' && pathname === '/api/orders') return RULES.ordersPost;
  if (method === 'POST' && pathname === '/api/reviews')
    return RULES.reviewsPost;
  if (method === 'POST' && pathname === '/api/admin/auth/login')
    return RULES.adminLoginPost;

  if (pathname.startsWith('/api/') && method === 'GET') return RULES.apiGet;
  return RULES.generalPage;
}

function cleanup(now: number) {
  if (now - lastCleanupAt < 2 * 60 * 1000) return;
  lastCleanupAt = now;

  for (const [key, timestamps] of hitsByKey.entries()) {
    if (
      timestamps.length === 0 ||
      timestamps[timestamps.length - 1] < now - 60 * 60 * 1000
    ) {
      hitsByKey.delete(key);
    }
  }
}

export function consumeIpRateLimit(input: {
  ip: string;
  pathname: string;
  method: string;
  now?: number;
}): RateLimitResult | null {
  const method = input.method.toUpperCase();
  const rule = resolveRule(input.pathname, method);
  if (!rule) return null;

  const now = input.now ?? Date.now();
  cleanup(now);

  const windowStart = now - rule.windowMs;
  const storageKey = `${rule.keyPrefix}:${input.ip}`;
  const recentHits = (hitsByKey.get(storageKey) ?? []).filter(
    (timestamp) => timestamp > windowStart,
  );
  recentHits.push(now);
  hitsByKey.set(storageKey, recentHits);

  const used = recentHits.length;
  const ok = used <= rule.limit;
  const earliestInWindow = recentHits[0] ?? now;
  const resetAt = earliestInWindow + rule.windowMs;
  const retryAfterSeconds = ok
    ? 0
    : Math.max(1, Math.ceil((resetAt - now) / 1000));
  const remaining = Math.max(0, rule.limit - used);

  return {
    ok,
    remaining,
    limit: rule.limit,
    retryAfterSeconds,
    resetAt,
  };
}
