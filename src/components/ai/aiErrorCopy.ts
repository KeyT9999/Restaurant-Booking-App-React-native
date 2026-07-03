const ERROR_COPY: Record<string, string> = {
  AI_DISABLED: 'Tro ly AI dang tam thoi bi tat.',
  TOOL_DISABLED: 'Tinh nang AI nay hien dang tam dung.',
  RATE_LIMITED: 'Ban dang gui qua nhieu yeu cau. Vui long thu lai sau.',
  AI_RATE_LIMITED: 'Ban dang gui qua nhieu yeu cau. Vui long thu lai sau.',
  AI_PROVIDER_RATE_LIMITED: 'Nha cung cap AI dang qua tai hoac het han muc tam thoi.',
  BUDGET_LIMITED: 'Tro ly AI dang tam dung do vuot ngan sach van hanh.',
  AI_UNAVAILABLE: 'Tro ly AI dang tam thoi khong kha dung. Vui long thu lai sau.',
  AI_TIMEOUT: 'Tro ly phan hoi qua lau. Vui long thu lai.',
  AI_AUTH_ERROR: 'Cau hinh Tro ly BookEat chua hop le.',
  AI_STREAM_INTERRUPTED: 'Phan hoi bi ngat giua chung. Vui long thu lai.',
  AI_STREAM_INVALID: 'Du lieu phan hoi tu tro ly khong hop le.',
  AUTH_REQUIRED: 'Ban can dang nhap de su dung tinh nang nay.',
};

const AUDIENCE_PREFIX: Record<string, string> = {
  customer: 'BookEat',
  owner: 'Owner AI',
  admin: 'Admin AI',
};

export const getAIChatErrorMessage = (
  error: { code?: string; errorCode?: string; message?: string } | null | undefined,
  audience: 'customer' | 'owner' | 'admin' = 'customer'
) => {
  const code = error?.code || error?.errorCode;
  const base = code ? ERROR_COPY[code] : null;

  if (base) {
    const prefix = AUDIENCE_PREFIX[audience] || 'AI';
    return `${prefix}: ${base}`;
  }

  return error?.message || 'Phan hoi AI bi gian doan. Vui long thu lai.';
};

export const isNonRetryableAIError = (
  error: { code?: string; errorCode?: string; retryable?: boolean } | null | undefined
) =>
  ['AI_DISABLED', 'TOOL_DISABLED', 'BUDGET_LIMITED', 'AI_AUTH_ERROR', 'AUTH_REQUIRED'].includes(
    error?.code || error?.errorCode || ''
  ) || error?.retryable === false;
