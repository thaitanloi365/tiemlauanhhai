import currency from 'currency.js';

const vndCurrencyOptions = {
	symbol: 'đ',
	separator: ',',
	decimal: '.',
	precision: 0,
	pattern: '!#'
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
			return 'bg-amber-100 text-amber-800';
		case 'confirmed':
			return 'bg-blue-100 text-blue-800';
		case 'preparing':
			return 'bg-indigo-100 text-indigo-800';
		case 'shipping':
			return 'bg-purple-100 text-purple-800';
		case 'delivered':
			return 'bg-green-100 text-green-800';
		case 'cancelled':
			return 'bg-red-100 text-red-800';
		case 'expired':
			return 'bg-slate-200 text-slate-800';
		default:
			return 'bg-slate-100 text-slate-800';
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
