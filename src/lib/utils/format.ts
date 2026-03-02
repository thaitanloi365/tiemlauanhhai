export function formatCurrency(value: number): string {
	return new Intl.NumberFormat('vi-VN', {
		style: 'currency',
		currency: 'VND',
		maximumFractionDigits: 0
	}).format(value);
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
