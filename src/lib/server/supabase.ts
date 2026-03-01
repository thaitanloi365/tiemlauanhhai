import { SUPABASE_SECRET_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

export function hasSupabaseConfig(): boolean {
	return Boolean(
		PUBLIC_SUPABASE_URL &&
			SUPABASE_SECRET_KEY &&
			!PUBLIC_SUPABASE_URL.includes('your-project') &&
			!SUPABASE_SECRET_KEY.includes('sb_secret_xxx')
	);
}

export function createServerSupabase() {
	return createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
		auth: { persistSession: false }
	});
}

export function createServerSupabaseAuthClient() {
	return createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		auth: { persistSession: false }
	});
}

export const MENU_MEDIA_BUCKET = 'menu-media';

export function extractStoragePath(publicUrl: string): string | null {
	const marker = `/storage/v1/object/public/${MENU_MEDIA_BUCKET}/`;
	const markerIndex = publicUrl.indexOf(marker);
	if (markerIndex === -1) return null;

	const rawPath = publicUrl.slice(markerIndex + marker.length).split('?')[0]?.split('#')[0] ?? '';
	if (!rawPath) return null;

	try {
		return decodeURIComponent(rawPath);
	} catch {
		return rawPath;
	}
}

export async function deleteStorageFiles(urls: string[]) {
	if (!hasSupabaseConfig()) return;

	const paths = Array.from(
		new Set(
			urls
				.map((url) => extractStoragePath(url))
				.filter((path): path is string => Boolean(path))
		)
	);
	if (paths.length === 0) return;

	const supabase = createServerSupabase();
	const { error } = await supabase.storage.from(MENU_MEDIA_BUCKET).remove(paths);
	if (error) {
		console.error('Failed to clean up Supabase storage files:', error.message, { paths });
	}
}
