import { z } from 'zod';
import { isStrongPassword, strongPasswordGuideline } from './password-policy';
import {
  ORDER_STATUS_VALUES,
  SCHEDULED_SLOT_VALUES,
} from '@/lib/constants/order';
import { PROMOTION_TYPE_VALUES } from '@/lib/constants/promotion';
import { CHAT_LIMITS } from '@/lib/constants/chat';

const vnPhoneRegex = /^(?:\+84|84|0)(?:3|5|7|8|9)\d{8}$/;
const canonicalUuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuidLikeSchema = z
  .string()
  .trim()
  .regex(canonicalUuidRegex, 'UUID không hợp lệ');

export const orderSchema = z.object({
  session_id: uuidLikeSchema,
  customer_name: z.string().min(2, 'Tên cần ít nhất 2 ký tự').max(120),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => vnPhoneRegex.test(value.replace(/\s+/g, '')),
      'Số điện thoại Việt Nam không hợp lệ',
    ),
  email: z.string().trim().email('Email không hợp lệ').optional().nullable(),
  province: z.string().min(1, 'Vui lòng chọn Tỉnh/Thành'),
  district: z.string().min(1, 'Vui lòng chọn Quận/Huyện'),
  ward: z.string().min(1, 'Vui lòng chọn Phường/Xã'),
  address: z.string().min(5, 'Vui lòng nhập địa chỉ chi tiết'),
  note: z.string().optional().nullable(),
  website: z.string().trim().max(200).optional().nullable(),
  promotion_code: z
    .string()
    .trim()
    .min(3, 'Mã khuyến mãi không hợp lệ')
    .max(40, 'Mã khuyến mãi không hợp lệ')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Mã khuyến mãi không hợp lệ')
    .optional()
    .nullable(),
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày nhận món không hợp lệ'),
  scheduled_slot: z.enum(SCHEDULED_SLOT_VALUES, 'Khung giờ nhận món không hợp lệ'),
  items: z
    .array(
      z.object({
        variant_id: uuidLikeSchema,
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, 'Giỏ hàng đang trống'),
});

export const promotionSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, 'Mã khuyến mãi cần ít nhất 3 ký tự')
      .max(40, 'Mã khuyến mãi tối đa 40 ký tự')
      .regex(/^[A-Z0-9_-]+$/, 'Mã khuyến mãi chỉ gồm chữ in hoa, số, "_" hoặc "-"'),
    type: z.enum(PROMOTION_TYPE_VALUES),
    discount_value: z.number().int().positive('Giá trị giảm phải lớn hơn 0'),
    max_discount_amount: z.number().int().min(0).nullable().optional(),
    min_order_amount: z.number().int().min(0, 'Đơn tối thiểu không hợp lệ'),
    max_usage: z
      .number()
      .int()
      .positive('Giới hạn lượt dùng phải lớn hơn 0')
      .nullable()
      .optional(),
    valid_from: z.string().datetime('Thời gian bắt đầu không hợp lệ'),
    valid_until: z.string().datetime('Thời gian kết thúc không hợp lệ'),
    is_active: z.boolean().optional(),
  })
  .superRefine((payload, ctx) => {
    if (payload.type === 'fixed_amount' && payload.max_discount_amount != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['max_discount_amount'],
        message: 'Loại giảm số tiền không dùng giới hạn giảm tối đa',
      });
    }
    if (payload.type === 'percentage') {
      if (payload.discount_value > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['discount_value'],
          message: 'Phần trăm giảm tối đa là 100',
        });
      }
      if (payload.max_discount_amount == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['max_discount_amount'],
          message: 'Cần nhập giới hạn tiền giảm tối đa cho mã giảm phần trăm',
        });
      }
    }
    if (
      new Date(payload.valid_until).getTime() <=
      new Date(payload.valid_from).getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valid_until'],
        message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
      });
    }
  });

export const promotionUpdateSchema = z
  .object({
    discount_value: z
      .number()
      .int()
      .positive('Giá trị giảm phải lớn hơn 0')
      .optional(),
    max_discount_amount: z.number().int().min(0).nullable().optional(),
    min_order_amount: z.number().int().min(0).optional(),
    max_usage: z
      .number()
      .int()
      .positive('Giới hạn lượt dùng phải lớn hơn 0')
      .nullable()
      .optional(),
    valid_from: z.string().datetime('Thời gian bắt đầu không hợp lệ').optional(),
    valid_until: z.string().datetime('Thời gian kết thúc không hợp lệ').optional(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (payload) =>
      !(payload.valid_from && payload.valid_until) ||
      new Date(payload.valid_until).getTime() >
        new Date(payload.valid_from).getTime(),
    {
      path: ['valid_until'],
      message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
    },
  );

export const promotionValidateSchema = z.object({
  code: z.string().trim().min(1, 'Vui lòng nhập mã khuyến mãi'),
  order_amount: z.number().int().min(0),
});

export const reviewSchema = z.object({
  session_id: uuidLikeSchema,
  order_id: uuidLikeSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000),
});

export const orderMessageCreateSchema = z
  .object({
    content: z
      .string()
      .trim()
      .max(CHAT_LIMITS.MAX_TEXT_LENGTH, 'Tin nhắn tối đa 1000 ký tự')
      .optional()
      .nullable(),
    images: z.array(z.string().trim().url()).max(3).optional().default([]),
  })
  .superRefine((payload, ctx) => {
    const hasContent = Boolean(payload.content && payload.content.trim().length > 0);
    const hasImages = (payload.images?.length ?? 0) > 0;
    if (!hasContent && !hasImages) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['content'],
        message: 'Tin nhắn phải có nội dung hoặc hình ảnh',
      });
    }
  });

export const adminOrderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUS_VALUES),
  tracking_id: z.string().max(120).nullable().optional(),
  tracking_url: z.string().url().max(500).nullable().optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export const employeeRoleSchema = z.enum(['super_admin', 'manager']);

const strongPasswordSchema = z
  .string()
  .min(8, 'Mật khẩu cần ít nhất 8 ký tự')
  .max(200)
  .refine((value) => isStrongPassword(value), strongPasswordGuideline);

export const employeeSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ'),
  password: strongPasswordSchema,
  role: employeeRoleSchema,
  display_name: z.string().trim().max(120).optional().nullable(),
});

export const employeeUpdateSchema = z.object({
  role: employeeRoleSchema,
  display_name: z.string().trim().max(120).optional().nullable(),
});

export const changePasswordSchema = z
  .object({
    current_password: z
      .string()
      .min(8, 'Mật khẩu hiện tại không hợp lệ')
      .max(200),
    new_password: strongPasswordSchema,
  })
  .refine((payload) => payload.current_password !== payload.new_password, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    path: ['new_password'],
  });

export const subscriberSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ'),
  province: z.string().trim().min(1, 'Vui lòng chọn Tỉnh/Thành'),
  district: z.string().trim().optional().nullable(),
});
