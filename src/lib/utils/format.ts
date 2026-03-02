import currency from 'currency.js';

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
  switch (status) {
    case 'pending':
      return 'Chờ xác nhận';
    case 'confirmed':
      return 'Đã xác nhận';
    case 'preparing':
      return 'Đang chuẩn bị';
    case 'shipping':
      return 'Đang giao';
    case 'delivered':
      return 'Đã giao';
    case 'cancelled':
      return 'Đã hủy';
    case 'expired':
      return 'Hết hạn';
    default:
      return status;
  }
}

export function statusClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'border-transparent bg-secondary text-secondary-foreground';
    case 'confirmed':
      return 'border-transparent bg-primary text-primary-foreground';
    case 'preparing':
      return 'border-border bg-accent text-accent-foreground';
    case 'shipping':
      return 'border-transparent bg-primary/85 text-primary-foreground';
    case 'delivered':
      return 'border-transparent bg-primary text-primary-foreground';
    case 'cancelled':
      return 'border-transparent bg-destructive text-primary-foreground';
    case 'expired':
      return 'border-border bg-muted text-muted-foreground';
    default:
      return 'border-border bg-muted text-foreground';
  }
}

export function statusBadgeVariant(
  status: string,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'confirmed':
    case 'shipping':
    case 'delivered':
      return 'default';
    case 'preparing':
    case 'expired':
      return 'outline';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
