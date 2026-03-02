import { json, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { blockIp, listBlockedIps, sanitizeIp } from '$lib/server/ip-block';

const blockIpSchema = z.object({
	ip: z.string().trim().min(3, 'IP không hợp lệ').max(120, 'IP không hợp lệ'),
	reason: z.string().trim().max(500).optional().nullable(),
	expiresAt: z.string().datetime().optional().nullable()
});

export async function GET({ locals }: RequestEvent) {
	if (!locals.adminUser) return json({ message: 'Unauthorized' }, { status: 401 });
	const blockedIps = await listBlockedIps();
	return json({ blockedIps });
}

export async function POST({ locals, request }: RequestEvent) {
	if (!locals.adminUser) return json({ message: 'Unauthorized' }, { status: 401 });

	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return json({ message: 'Payload không hợp lệ' }, { status: 400 });
	}

	const parsed = blockIpSchema.safeParse(payload);
	if (!parsed.success) {
		return json({ message: parsed.error.issues[0]?.message ?? 'Payload không hợp lệ' }, { status: 400 });
	}

	const normalizedIp = sanitizeIp(parsed.data.ip);
	if (!normalizedIp) {
		return json({ message: 'IP không hợp lệ' }, { status: 400 });
	}

	const blocked = await blockIp({
		ip: normalizedIp,
		reason: parsed.data.reason ?? null,
		blockedBy: locals.adminUser.id,
		expiresAt: parsed.data.expiresAt ?? null
	});

	if (!blocked) {
		return json({ message: 'Không thể block IP' }, { status: 500 });
	}

	return json({ blockedIp: blocked });
}
