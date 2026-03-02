import { z } from 'zod';

const vnPhoneRegex = /^(?:\+84|84|0)(?:3|5|7|8|9)\d{8}$/;
const canonicalUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuidLikeSchema = z.string().trim().regex(canonicalUuidRegex, 'UUID không hợp lệ');

export const orderSchema = z.object({
	sessionId: uuidLikeSchema,
	customerName: z.string().min(2, 'Tên cần ít nhất 2 ký tự').max(120),
	phone: z
		.string()
		.trim()
		.refine((value) => vnPhoneRegex.test(value.replace(/\s+/g, '')), 'Số điện thoại Việt Nam không hợp lệ'),
	province: z.string().min(1, 'Vui lòng chọn Tỉnh/Thành'),
	district: z.string().min(1, 'Vui lòng chọn Quận/Huyện'),
	ward: z.string().min(1, 'Vui lòng chọn Phường/Xã'),
	address: z.string().min(5, 'Vui lòng nhập địa chỉ chi tiết'),
	note: z.string().optional().nullable(),
	website: z.string().trim().max(200).optional().nullable(),
	scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày nhận món không hợp lệ'),
	scheduledSlot: z.enum(
		['10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'],
		'Khung giờ nhận món không hợp lệ'
	),
	items: z
		.array(
			z.object({
				variantId: uuidLikeSchema,
				quantity: z.number().int().positive()
			})
		)
		.min(1, 'Giỏ hàng đang trống')
});

export const reviewSchema = z.object({
	sessionId: uuidLikeSchema,
	orderId: uuidLikeSchema,
	rating: z.number().int().min(1).max(5),
	comment: z.string().min(3).max(800)
});

export const adminOrderUpdateSchema = z.object({
	status: z.enum(['pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled']),
	trackingId: z.string().max(120).nullable().optional(),
	trackingUrl: z.string().url().max(500).nullable().optional()
});

export const adminLoginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8).max(200)
});

export const subscriberSchema = z.object({
	email: z.string().trim().email('Email không hợp lệ'),
	province: z.string().trim().min(1, 'Vui lòng chọn Tỉnh/Thành'),
	district: z.string().trim().optional().nullable()
});
