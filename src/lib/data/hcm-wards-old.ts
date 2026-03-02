export type WardMap = Record<string, string[]>;

const COMMON_FALLBACK = 'Khu vực khác';

// Danh mục rút gọn theo địa chỉ cũ (ưu tiên các phường/xã được dùng phổ biến).
export const HCM_WARDS_OLD: WardMap = {
	'Quận 1': ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Cầu Ông Lãnh', 'Phường Cô Giang', COMMON_FALLBACK],
	'Quận 12': ['Phường An Phú Đông', 'Phường Hiệp Thành', 'Phường Tân Chánh Hiệp', 'Phường Thạnh Lộc', COMMON_FALLBACK],
	'Quận Gò Vấp': ['Phường 1', 'Phường 3', 'Phường 5', 'Phường 7', 'Phường 10', 'Phường 14', COMMON_FALLBACK],
	'Quận Bình Thạnh': ['Phường 1', 'Phường 11', 'Phường 13', 'Phường 14', 'Phường 22', 'Phường 25', COMMON_FALLBACK],
	'Quận Tân Bình': ['Phường 2', 'Phường 4', 'Phường 10', 'Phường 12', 'Phường 15', COMMON_FALLBACK],
	'Quận Tân Phú': ['Phường Hiệp Tân', 'Phường Hòa Thạnh', 'Phường Phú Thạnh', 'Phường Sơn Kỳ', COMMON_FALLBACK],
	'Quận Phú Nhuận': ['Phường 1', 'Phường 2', 'Phường 7', 'Phường 9', 'Phường 15', COMMON_FALLBACK],
	'Quận 3': ['Phường Võ Thị Sáu', 'Phường 1', 'Phường 4', 'Phường 5', 'Phường 9', COMMON_FALLBACK],
	'Quận 10': ['Phường 2', 'Phường 4', 'Phường 7', 'Phường 12', 'Phường 14', COMMON_FALLBACK],
	'Quận 11': ['Phường 1', 'Phường 3', 'Phường 5', 'Phường 10', 'Phường 14', COMMON_FALLBACK],
	'Quận 4': ['Phường 1', 'Phường 4', 'Phường 8', 'Phường 13', 'Phường 18', COMMON_FALLBACK],
	'Quận 5': ['Phường 1', 'Phường 4', 'Phường 7', 'Phường 11', 'Phường 14', COMMON_FALLBACK],
	'Quận 6': ['Phường 1', 'Phường 5', 'Phường 8', 'Phường 11', 'Phường 14', COMMON_FALLBACK],
	'Quận 8': ['Phường 1', 'Phường 5', 'Phường 7', 'Phường 10', 'Phường 16', COMMON_FALLBACK],
	'Quận Bình Tân': ['Phường An Lạc', 'Phường Bình Hưng Hòa A', 'Phường Bình Hưng Hòa B', 'Phường Tân Tạo', COMMON_FALLBACK],
	'Quận 7': ['Phường Bình Thuận', 'Phường Phú Mỹ', 'Phường Tân Hưng', 'Phường Tân Phong', COMMON_FALLBACK],
	'Huyện Củ Chi': ['Xã Tân Thông Hội', 'Xã Trung Lập Hạ', 'Xã Phước Vĩnh An', 'Xã Nhuận Đức', COMMON_FALLBACK],
	'Huyện Hóc Môn': ['Xã Bà Điểm', 'Xã Đông Thạnh', 'Xã Nhị Bình', 'Xã Tân Xuân', 'Thị trấn Hóc Môn', COMMON_FALLBACK],
	'Huyện Bình Chánh': ['Xã Bình Hưng', 'Xã Phong Phú', 'Xã Vĩnh Lộc A', 'Xã Vĩnh Lộc B', 'Thị trấn Tân Túc', COMMON_FALLBACK],
	'Huyện Nhà Bè': ['Xã Phú Xuân', 'Xã Phước Kiển', 'Xã Nhơn Đức', 'Thị trấn Nhà Bè', COMMON_FALLBACK],
	'Huyện Cần Giờ': ['Xã Bình Khánh', 'Xã An Thới Đông', 'Xã Long Hòa', 'Thị trấn Cần Thạnh', COMMON_FALLBACK],
	'Quận 2': ['Phường An Khánh', 'Phường An Phú', 'Phường Bình An', 'Phường Thảo Điền', 'Phường Thủ Thiêm', COMMON_FALLBACK],
	'Quận 9': ['Phường Hiệp Phú', 'Phường Long Bình', 'Phường Long Trường', 'Phường Phước Bình', COMMON_FALLBACK],
	'Quận Thủ Đức': ['Phường Bình Chiểu', 'Phường Hiệp Bình Chánh', 'Phường Linh Đông', 'Phường Linh Tây', COMMON_FALLBACK]
};
