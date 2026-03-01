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
