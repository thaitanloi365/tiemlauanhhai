import { NextRequest, NextResponse } from 'next/server';
import { unblockIpById } from '@/lib/server/ip-block';
import { resolveAdminUserFromRequest } from '@/lib/server/next-admin';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const params = await context.params;
  if (!params.id)
    return NextResponse.json({ message: 'Thiếu id' }, { status: 400 });

  const ok = await unblockIpById(params.id);
  if (!ok)
    return NextResponse.json(
      { message: 'Không tìm thấy IP block' },
      { status: 404 },
    );
  return NextResponse.json({ ok: true });
}
