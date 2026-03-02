export const strongPasswordGuideline =
	'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt';

export const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,200}$/;

export function isStrongPassword(value: string): boolean {
	return strongPasswordPattern.test(value);
}
