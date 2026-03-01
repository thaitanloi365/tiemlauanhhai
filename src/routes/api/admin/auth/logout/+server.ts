import { json } from '@sveltejs/kit';
import { ADMIN_COOKIE_NAME } from '$lib/server/admin-auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete(ADMIN_COOKIE_NAME, { path: '/' });
	return json({ ok: true });
};
