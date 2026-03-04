export const PROMOTION_TYPE_VALUES = ['fixed_amount', 'percentage'] as const;

export type PromotionTypeValue = (typeof PROMOTION_TYPE_VALUES)[number];

export const PROMOTION_TYPE_UI = {
  fixed_amount: {
    label: 'Giảm số tiền',
  },
  percentage: {
    label: 'Giảm phần trăm',
  },
} as const;

export const PROMOTION_TYPE_OPTIONS = PROMOTION_TYPE_VALUES.map((value) => ({
  value,
  label: PROMOTION_TYPE_UI[value].label,
}));
