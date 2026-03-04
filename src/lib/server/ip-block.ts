import { createServerSupabase, hasSupabaseConfig } from '@/lib/supabase/server';
import {
  now as dayjsNow,
  parseInTz,
  toIso,
} from '@/lib/date';

type BlockedIpRecord = {
  id: string;
  ip_address: string;
  reason: string | null;
  blocked_by: string | null;
  expires_at: string | null;
  created_at: string;
};

type CachedBlockStatus = {
  blocked: boolean;
  reason: string | null;
  expiresAt: string | null;
  cachedAt: number;
};

const BLOCK_CACHE_TTL_MS = 60 * 1000;
const AUTO_BLOCK_WINDOW_MS = 60 * 60 * 1000;
const AUTO_BLOCK_THRESHOLD = 3;
const AUTO_BLOCK_DURATION_MS = 24 * 60 * 60 * 1000;

const blockStatusCache = new Map<string, CachedBlockStatus>();
const localBlockedIps = new Map<string, BlockedIpRecord>();
const violationsByIp = new Map<string, number[]>();

function shouldSkipIpBlock() {
  return process.env.NODE_ENV === 'development';
}

function nowIso() {
  return toIso();
}

function normalizeIp(input: string) {
  const trimmed = input.trim();
  if (trimmed.startsWith('::ffff:')) return trimmed.slice(7);
  return trimmed;
}

function isRecordActive(
  record: Pick<BlockedIpRecord, 'expires_at'>,
  now = dayjsNow().valueOf(),
) {
  if (!record.expires_at) return true;
  return parseInTz(record.expires_at).valueOf() > now;
}

function setCachedStatus(
  ip: string,
  blocked: boolean,
  reason: string | null,
  expiresAt: string | null,
) {
  blockStatusCache.set(ip, {
    blocked,
    reason,
    expiresAt,
    cachedAt: dayjsNow().valueOf(),
  });
}

function getCachedStatus(ip: string) {
  const cached = blockStatusCache.get(ip);
  if (!cached) return null;
  if (dayjsNow().valueOf() - cached.cachedAt > BLOCK_CACHE_TTL_MS) return null;
  return cached;
}

function cleanupLocalState() {
  const now = dayjsNow().valueOf();

  for (const [ip, record] of localBlockedIps.entries()) {
    if (!isRecordActive(record, now)) {
      localBlockedIps.delete(ip);
    }
  }

  for (const [ip, timestamps] of violationsByIp.entries()) {
    const recent = timestamps.filter(
      (timestamp) => timestamp > now - AUTO_BLOCK_WINDOW_MS,
    );
    if (recent.length === 0) {
      violationsByIp.delete(ip);
    } else {
      violationsByIp.set(ip, recent);
    }
  }
}

async function getSupabaseBlockedIp(
  ip: string,
): Promise<BlockedIpRecord | null> {
  const supabase = createServerSupabase();
  const now = nowIso();

  const { data, error } = await supabase
    .from('blocked_ips')
    .select('id,ip_address,reason,blocked_by,expires_at,created_at')
    .eq('ip_address', ip)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return (data as BlockedIpRecord | null) ?? null;
}

async function upsertSupabaseBlockedIp(input: {
  ip: string;
  reason: string | null;
  blockedBy?: string | null;
  expiresAt?: string | null;
}) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('blocked_ips')
    .upsert(
      {
        ip_address: input.ip,
        reason: input.reason,
        blocked_by: input.blockedBy ?? null,
        expires_at: input.expiresAt ?? null,
      },
      { onConflict: 'ip_address' },
    )
    .select('id,ip_address,reason,blocked_by,expires_at,created_at')
    .single();

  if (error) return null;
  return (data as BlockedIpRecord) ?? null;
}

export function sanitizeIp(rawIp: string | null | undefined) {
  if (!rawIp) return '';
  return normalizeIp(rawIp);
}

export async function isIpBlocked(ipInput: string) {
  if (shouldSkipIpBlock()) {
    return {
      blocked: false,
      reason: null as string | null,
      expiresAt: null as string | null,
    };
  }

  cleanupLocalState();
  const ip = sanitizeIp(ipInput);
  if (!ip)
    return {
      blocked: false,
      reason: null as string | null,
      expiresAt: null as string | null,
    };

  const cached = getCachedStatus(ip);
  if (cached) {
    return {
      blocked: cached.blocked,
      reason: cached.reason,
      expiresAt: cached.expiresAt,
    };
  }

  const localRecord = localBlockedIps.get(ip);
  if (localRecord && isRecordActive(localRecord)) {
    setCachedStatus(
      ip,
      true,
      localRecord.reason ?? 'Blocked',
      localRecord.expires_at,
    );
    return {
      blocked: true,
      reason: localRecord.reason,
      expiresAt: localRecord.expires_at,
    };
  }

  if (!hasSupabaseConfig()) {
    setCachedStatus(ip, false, null, null);
    return { blocked: false, reason: null, expiresAt: null };
  }

  const supabaseRecord = await getSupabaseBlockedIp(ip);
  if (!supabaseRecord || !isRecordActive(supabaseRecord)) {
    setCachedStatus(ip, false, null, null);
    return { blocked: false, reason: null, expiresAt: null };
  }

  setCachedStatus(ip, true, supabaseRecord.reason, supabaseRecord.expires_at);
  return {
    blocked: true,
    reason: supabaseRecord.reason,
    expiresAt: supabaseRecord.expires_at,
  };
}

export async function recordRateLimitViolation(ipInput: string) {
  const ip = sanitizeIp(ipInput);
  if (!ip) return { autoBlocked: false };

  cleanupLocalState();
  const now = dayjsNow().valueOf();
  const recent = [...(violationsByIp.get(ip) ?? []), now].filter(
    (timestamp) => timestamp > now - AUTO_BLOCK_WINDOW_MS,
  );
  violationsByIp.set(ip, recent);

  if (recent.length < AUTO_BLOCK_THRESHOLD) return { autoBlocked: false };

  const existing = await isIpBlocked(ip);
  if (existing.blocked) return { autoBlocked: false };

  const expiresAt = dayjsNow()
    .add(AUTO_BLOCK_DURATION_MS, 'millisecond')
    .toISOString();
  const reason = 'Auto-block due to repeated rate limit violations';
  const blocked = await blockIp({
    ip,
    reason,
    expiresAt,
  });

  return { autoBlocked: Boolean(blocked) };
}

export async function blockIp(input: {
  ip: string;
  reason?: string | null;
  blockedBy?: string | null;
  expiresAt?: string | null;
}) {
  const ip = sanitizeIp(input.ip);
  if (!ip) return null;

  const fallbackRecord: BlockedIpRecord = {
    id: crypto.randomUUID(),
    ip_address: ip,
    reason: input.reason ?? null,
    blocked_by: input.blockedBy ?? null,
    expires_at: input.expiresAt ?? null,
    created_at: nowIso(),
  };

  if (!hasSupabaseConfig()) {
    localBlockedIps.set(ip, fallbackRecord);
    setCachedStatus(ip, true, fallbackRecord.reason, fallbackRecord.expires_at);
    return fallbackRecord;
  }

  const record = await upsertSupabaseBlockedIp({
    ip,
    reason: input.reason ?? null,
    blockedBy: input.blockedBy ?? null,
    expiresAt: input.expiresAt ?? null,
  });

  if (!record) {
    localBlockedIps.set(ip, fallbackRecord);
    setCachedStatus(ip, true, fallbackRecord.reason, fallbackRecord.expires_at);
    return fallbackRecord;
  }

  localBlockedIps.delete(ip);
  setCachedStatus(ip, true, record.reason, record.expires_at);
  return record;
}

export async function listBlockedIps() {
  cleanupLocalState();

  if (!hasSupabaseConfig()) {
    return Array.from(localBlockedIps.values()).sort((a, b) =>
      a.created_at < b.created_at ? 1 : -1,
    );
  }

  const supabase = createServerSupabase();
  const now = nowIso();
  const { data, error } = await supabase
    .from('blocked_ips')
    .select('id,ip_address,reason,blocked_by,expires_at,created_at')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data as BlockedIpRecord[]) ?? [];
}

export async function unblockIpById(id: string) {
  const localEntry = Array.from(localBlockedIps.entries()).find(
    ([, value]) => value.id === id,
  );
  if (localEntry) {
    const [ip] = localEntry;
    localBlockedIps.delete(ip);
    blockStatusCache.delete(ip);
    return true;
  }

  if (!hasSupabaseConfig()) return false;

  const supabase = createServerSupabase();
  const { data: existing, error: existingError } = await supabase
    .from('blocked_ips')
    .select('id,ip_address')
    .eq('id', id)
    .maybeSingle();
  if (existingError || !existing) return false;

  const { error } = await supabase.from('blocked_ips').delete().eq('id', id);
  if (error) return false;

  if (typeof existing.ip_address === 'string') {
    blockStatusCache.delete(existing.ip_address);
  }
  return true;
}
