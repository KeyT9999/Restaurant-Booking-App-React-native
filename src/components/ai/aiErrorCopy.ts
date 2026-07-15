const ERROR_COPY: Record<string, string> = {
  AI_DISABLED: 'Trợ lý AI đang tạm thời bị tắt.',
  TOOL_DISABLED: 'Tính năng AI này hiện đang tạm dừng.',
  RATE_LIMITED: 'Bạn đang gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
  AI_RATE_LIMITED: 'Bạn đang gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
  AI_PROVIDER_RATE_LIMITED: 'Nhà cung cấp AI đang quá tải hoặc hết hạn mức tạm thời.',
  BUDGET_LIMITED: 'Trợ lý AI đang tạm dừng do vượt ngân sách vận hành.',
  AI_UNAVAILABLE: 'Trợ lý AI đang tạm thời không khả dụng. Vui lòng thử lại sau.',
  AI_TIMEOUT: 'Trợ lý phản hồi quá lâu. Vui lòng thử lại.',
  AI_AUTH_ERROR: 'Cấu hình Trợ lý BookEat chưa hợp lệ.',
  AI_STREAM_INTERRUPTED: 'Phản hồi bị ngắt giữa chừng. Vui lòng thử lại.',
  AI_STREAM_INVALID: 'Dữ liệu phản hồi từ trợ lý không hợp lệ.',
  AUTH_REQUIRED: 'Bạn cần đăng nhập để sử dụng tính năng này.',
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

  return error?.message || 'Phản hồi AI bị gián đoạn. Vui lòng thử lại.';
};

export const isNonRetryableAIError = (
  error: { code?: string; errorCode?: string; retryable?: boolean } | null | undefined
) =>
  ['AI_DISABLED', 'TOOL_DISABLED', 'BUDGET_LIMITED', 'AI_AUTH_ERROR', 'AUTH_REQUIRED'].includes(
    error?.code || error?.errorCode || ''
  ) || error?.retryable === false;
