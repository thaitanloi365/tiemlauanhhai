import { json, type RequestEvent } from '@sveltejs/kit';
import {
	createServerSupabase,
	deleteStorageFiles,
	hasSupabaseConfig,
	MENU_MEDIA_BUCKET
} from '$lib/server/supabase';

function getFileExtension(name: string) {
	const parts = name.split('.');
	return parts.length > 1 ? parts.pop()!.toLowerCase() : 'bin';
}

export async function POST({ request }: RequestEvent) {
	if (!hasSupabaseConfig()) {
		return json({ message: 'Thiếu cấu hình Supabase' }, { status: 400 });
	}

	const formData = await request.formData();
	const files = formData.getAll('files').filter((value): value is File => value instanceof File);
	if (files.length === 0) {
		return json({ message: 'Không có file để upload' }, { status: 400 });
	}

	const supabase = createServerSupabase();
	const uploaded: { url: string; type: 'image' | 'video'; altText: string | null }[] = [];

	for (const file of files) {
		const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
		const ext = getFileExtension(file.name);
		const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

		const { error: uploadError } = await supabase.storage.from(MENU_MEDIA_BUCKET).upload(path, file, {
			contentType: file.type,
			upsert: false
		});
		if (uploadError) {
			return json({ message: uploadError.message }, { status: 500 });
		}

		const { data } = supabase.storage.from(MENU_MEDIA_BUCKET).getPublicUrl(path);
		uploaded.push({
			url: data.publicUrl,
			type: mediaType,
			altText: file.name || null
		});
	}

	return json({ files: uploaded });
}

export async function DELETE({ request }: RequestEvent) {
	if (!hasSupabaseConfig()) {
		return json({ message: 'Thiếu cấu hình Supabase' }, { status: 400 });
	}

	const body = await request.json().catch(() => null);
	const urls = Array.isArray(body?.urls)
		? body.urls.filter((url: unknown): url is string => typeof url === 'string' && url.length > 0)
		: [];

	if (urls.length === 0) {
		return json({ message: 'Không có URL để xóa' }, { status: 400 });
	}

	await deleteStorageFiles(urls);
	return json({ ok: true });
}
