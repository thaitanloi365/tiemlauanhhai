import { json, type RequestEvent } from '@sveltejs/kit';
import { unblockIpById } from '$lib/server/ip-block';

export async function DELETE({ params, locals }: RequestEvent<{ id: string }>) {
	if (!locals.adminUser) return json({ message: 'Unauthorized' }, { status: 401 });
	if (!params.id) return json({ message: 'Thiếu id' }, { status: 400 });

	const ok = await unblockIpById(params.id);
	if (!ok) return json({ message: 'Không tìm thấy IP block' }, { status: 404 });
	return json({ ok: true });
}
