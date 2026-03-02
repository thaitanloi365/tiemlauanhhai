import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.adminUser) {
		throw redirect(303, '/admin/login');
	}
	if (locals.adminUser.role !== 'super_admin') {
		throw redirect(303, '/admin');
	}

	return {
		adminUser: locals.adminUser
	};
};
