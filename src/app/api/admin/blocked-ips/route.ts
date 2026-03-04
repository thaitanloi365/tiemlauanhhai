import { NextRequest, NextResponse } from 'next/server';
import { blockIpSchema } from '@/lib/schemas';
import { blockIp, listBlockedIps, sanitizeIp } from '@/lib/server/ip-block';
import { resolveAdminUserFromRequest } from '@/lib/server/next-admin';

export async function GET(request: NextRequest) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const blockedIps = await listBlockedIps();
  return NextResponse.json({ blockedIps });
}

export async function POST(request: NextRequest) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Payload không hợp lệ' },
      { status: 400 },
    );
  }

  const parsed = blockIpSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Payload không hợp lệ' },
      { status: 400 },
    );
  }

  const normalizedIp = sanitizeIp(parsed.data.ip);
  if (!normalizedIp) {
    return NextResponse.json({ message: 'IP không hợp lệ' }, { status: 400 });
  }

  const blocked = await blockIp({
    ip: normalizedIp,
    reason: parsed.data.reason ?? null,
    blockedBy: adminUser.id,
    expiresAt: parsed.data.expiresAt ?? null,
  });

  if (!blocked) {
    return NextResponse.json(
      { message: 'Không thể block IP' },
      { status: 500 },
    );
  }

  return NextResponse.json({ blockedIp: blocked });
}
