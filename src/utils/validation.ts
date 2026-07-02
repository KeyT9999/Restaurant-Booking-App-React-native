export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^(0[35789])[0-9]{8}$/;

export const validateEmail = (email: string): string | null => {
  const trimmed = email.trim();
  if (!trimmed) return 'Email không được để trống';
  if (!EMAIL_REGEX.test(trimmed)) return 'Email không hợp lệ';
  return null;
};

export const validatePhone = (phone: string): string | null => {
  const trimmed = phone.trim();
  if (!trimmed) return 'Số điện thoại không được để trống';
  if (!PHONE_REGEX.test(trimmed)) {
    return 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08, 09';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Mật khẩu không được để trống';
  if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
  return null;
};

export const validateFullName = (name: string): string | null => {
  const trimmed = name.trim();
  if (!trimmed) return 'Họ và tên không được để trống';
  if (trimmed.length < 2) return 'Họ và tên phải có ít nhất 2 ký tự';
  return null;
};
