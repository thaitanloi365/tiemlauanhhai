import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const currentYear = new Date().getFullYear();
	return {
		currentYear,
		yearOptions: [currentYear - 2, currentYear - 1, currentYear, currentYear + 1],
		statusOptions: [
			{ label: 'Tất cả trạng thái', value: '' },
			{ label: 'Chờ xác nhận', value: 'pending' },
			{ label: 'Đã xác nhận', value: 'confirmed' },
			{ label: 'Đang chuẩn bị', value: 'preparing' },
			{ label: 'Đang giao', value: 'shipping' },
			{ label: 'Đã giao', value: 'delivered' },
			{ label: 'Đã hủy', value: 'cancelled' }
		]
	};
};
