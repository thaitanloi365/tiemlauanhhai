import currency from 'currency.js';
import { ORDER_STATUS_UI } from '@/lib/constants/order';

const vndCurrencyOptions = {
  symbol: 'đ',
  separator: ',',
  decimal: '.',
  precision: 0,
  pattern: '!#',
} as const;

export function formatCurrency(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  return currency(amount, vndCurrencyOptions).format();
}

export function parseCurrencyInput(value: string): number | null {
  const digits = value.replace(/\D/g, '');
  if (!digits) return null;
  const parsed = currency(digits, vndCurrencyOptions).value;
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatCurrencyInput(value: string): string {
  const parsed = parseCurrencyInput(value);
  if (parsed === null) return '';
  return currency(parsed, vndCurrencyOptions).format();
}

export function statusLabel(status: string): string {
  if (status === 'expired') return 'Hết hạn';
  return ORDER_STATUS_UI[status as keyof typeof ORDER_STATUS_UI]?.label ?? status;
}

export function statusClass(status: string): string {
  if (status === 'expired') return 'border-border bg-muted text-muted-foreground';
  return (
    ORDER_STATUS_UI[status as keyof typeof ORDER_STATUS_UI]?.className ??
    'border-border bg-muted text-foreground'
  );
}

export function statusBadgeVariant(
  status: string,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'expired') return 'outline';
  return ORDER_STATUS_UI[status as keyof typeof ORDER_STATUS_UI]?.badgeVariant ?? 'outline';
}

export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
