import { NextRequest, NextResponse } from 'next/server';
import {
  createServerSupabase,
  deleteStorageFiles,
  hasSupabaseConfig,
  MENU_MEDIA_BUCKET,
} from '@/lib/server/supabase';
import { resolveAdminUserFromRequest } from '@/lib/server/next-admin';
import { formatDateOnlyInTz, now as dayjsNow } from '@/lib/date';

function getFileExtension(name: string) {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : 'bin';
}

export async function POST(request: NextRequest) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { message: 'Thiếu cấu hình Supabase' },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const files = formData
    .getAll('files')
    .filter((value): value is File => value instanceof File);
  if (files.length === 0) {
    return NextResponse.json(
      { message: 'Không có file để upload' },
      { status: 400 },
    );
  }

  const supabase = createServerSupabase();
  const uploaded: {
    url: string;
    type: 'image' | 'video';
    altText: string | null;
  }[] = [];

  for (const file of files) {
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    const ext = getFileExtension(file.name);
    const path = `${formatDateOnlyInTz(dayjsNow().valueOf())}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(MENU_MEDIA_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
    if (uploadError) {
      return NextResponse.json(
        { message: uploadError.message },
        { status: 500 },
      );
    }

    const { data } = supabase.storage
      .from(MENU_MEDIA_BUCKET)
      .getPublicUrl(path);
    uploaded.push({
      url: data.publicUrl,
      type: mediaType,
      altText: file.name || null,
    });
  }

  return NextResponse.json({ files: uploaded });
}

export async function DELETE(request: NextRequest) {
  const adminUser = await resolveAdminUserFromRequest(request);
  if (!adminUser)
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { message: 'Thiếu cấu hình Supabase' },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const urls = Array.isArray(body?.urls)
    ? body.urls.filter(
        (url: unknown): url is string =>
          typeof url === 'string' && url.length > 0,
      )
    : [];

  if (urls.length === 0) {
    return NextResponse.json(
      { message: 'Không có URL để xóa' },
      { status: 400 },
    );
  }

  await deleteStorageFiles(urls);
  return NextResponse.json({ ok: true });
}
