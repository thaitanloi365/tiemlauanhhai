import { z } from 'zod';

export const blockIpSchema = z.object({
  ip: z.string().trim().min(3, 'IP không hợp lệ').max(120, 'IP không hợp lệ'),
  reason: z.string().trim().max(500).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});
