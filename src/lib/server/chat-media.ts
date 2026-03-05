import { createServerSupabase } from '@/lib/server/supabase';
import { CHAT_LIMITS, isAllowedChatImageType } from '@/lib/constants/chat';

export const CHAT_MEDIA_BUCKET = 'chat-media';

function getFileExtension(name: string) {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : 'bin';
}

function getStoragePathFromPublicUrl(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${CHAT_MEDIA_BUCKET}/`;
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex === -1) return null;

  const rawPath =
    publicUrl
      .slice(markerIndex + marker.length)
      .split('?')[0]
      ?.split('#')[0] ?? '';
  if (!rawPath) return null;

  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

export function validateChatImageFiles(files: File[]) {
  if (files.length === 0) return 'Không có hình ảnh để upload';
  if (files.length > CHAT_LIMITS.MAX_IMAGES_PER_MESSAGE) {
    return `Mỗi lần chỉ upload tối đa ${CHAT_LIMITS.MAX_IMAGES_PER_MESSAGE} ảnh`;
  }
  for (const file of files) {
    if (!isAllowedChatImageType(file.type)) {
      return 'Chỉ hỗ trợ hình ảnh JPG, PNG, WEBP hoặc GIF';
    }
    if (file.size > CHAT_LIMITS.MAX_IMAGE_SIZE_BYTES) {
      return 'Mỗi ảnh tối đa 5MB';
    }
  }
  return null;
}

export async function uploadChatImages(orderId: string, files: File[]) {
  const supabase = createServerSupabase();
  const uploaded: string[] = [];

  for (const file of files) {
    const ext = getFileExtension(file.name);
    const path = `${orderId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(CHAT_MEDIA_BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from(CHAT_MEDIA_BUCKET).getPublicUrl(path);
    uploaded.push(data.publicUrl);
  }

  return uploaded;
}

export async function deleteChatStorageFiles(urls: string[]) {
  if (urls.length === 0) return;
  const paths = Array.from(
    new Set(
      urls
        .map((url) => getStoragePathFromPublicUrl(url))
        .filter((path): path is string => Boolean(path)),
    ),
  );
  if (paths.length === 0) return;

  const supabase = createServerSupabase();
  const { error } = await supabase.storage.from(CHAT_MEDIA_BUCKET).remove(paths);
  if (error) {
    console.error('Failed to clean up chat storage files:', error.message, { paths });
  }
}
