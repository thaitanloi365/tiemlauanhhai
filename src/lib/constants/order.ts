export const ORDER_TIME = {
  DAY_MS: 24 * 60 * 60 * 1000,
  PHONE_WINDOW_MS: 60 * 60 * 1000,
  EXPIRE_AFTER_MS: 24 * 60 * 60 * 1000,
  DELETE_AFTER_EXPIRED_MS: 7 * 24 * 60 * 60 * 1000,
} as const;

export const ORDER_LIMITS = {
  PHONE_ACTIVE_ORDER_LIMIT: 3,
} as const;

export const ORDER_STATUS_VALUES = [
  'pending',
  'confirmed',
  'preparing',
  'shipping',
  'delivered',
  'cancelled',
] as const;

export type OrderStatusValue = (typeof ORDER_STATUS_VALUES)[number];

export const ORDER_ACTIVE_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'shipping',
] as const;

export type ActiveOrderStatusValue = (typeof ORDER_ACTIVE_STATUSES)[number];

export const ORDER_STATUS_UI = {
  pending: {
    label: 'Chờ xác nhận',
    className: 'border-transparent bg-secondary text-secondary-foreground',
    badgeVariant: 'secondary',
  },
  confirmed: {
    label: 'Đã xác nhận',
    className: 'border-transparent bg-primary text-primary-foreground',
    badgeVariant: 'default',
  },
  preparing: {
    label: 'Đang chuẩn bị',
    className: 'border-border bg-accent text-accent-foreground',
    badgeVariant: 'outline',
  },
  shipping: {
    label: 'Đang giao',
    className: 'border-transparent bg-primary/85 text-primary-foreground',
    badgeVariant: 'default',
  },
  delivered: {
    label: 'Đã giao',
    className: 'border-transparent bg-primary text-primary-foreground',
    badgeVariant: 'default',
  },
  cancelled: {
    label: 'Đã hủy',
    className: 'border-transparent bg-destructive text-primary-foreground',
    badgeVariant: 'destructive',
  },
} as const;

export const ORDER_STATUS_OPTIONS = ORDER_STATUS_VALUES.map((value) => ({
  value,
  label: ORDER_STATUS_UI[value].label,
}));

export const SCHEDULED_SLOTS = {
  '10:00-12:00': { startHour: 10, endHour: 12 },
  '12:00-14:00': { startHour: 12, endHour: 14 },
  '14:00-16:00': { startHour: 14, endHour: 16 },
  '16:00-18:00': { startHour: 16, endHour: 18 },
  '18:00-20:00': { startHour: 18, endHour: 20 },
} as const;

export const SCHEDULED_SLOT_VALUES = [
  '10:00-12:00',
  '12:00-14:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00',
] as const;

export type ScheduledSlotValue = (typeof SCHEDULED_SLOT_VALUES)[number];

export const SCHEDULED_SLOT_OPTIONS = SCHEDULED_SLOT_VALUES.map((value) => {
  const [startHour, endHour] = value.split('-');
  return {
    value,
    label: `${startHour} - ${endHour}`,
  };
});
