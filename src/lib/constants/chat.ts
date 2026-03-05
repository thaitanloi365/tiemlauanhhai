export const CHAT_LIMITS = {
  MAX_IMAGES_PER_MESSAGE: 3,
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024,
  MAX_TEXT_LENGTH: 1000,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const;

const chatAllowedImageTypes = new Set<string>(CHAT_LIMITS.ALLOWED_IMAGE_TYPES);

export function isAllowedChatImageType(mimeType: string) {
  return chatAllowedImageTypes.has(mimeType);
}

export const CHAT_READONLY_ORDER_STATUSES: AppTypes.OrderStatus[] = [
  'delivered',
  'cancelled',
];

export function isChatReadonlyByOrderStatus(status: string) {
  return CHAT_READONLY_ORDER_STATUSES.includes(status as AppTypes.OrderStatus);
}
