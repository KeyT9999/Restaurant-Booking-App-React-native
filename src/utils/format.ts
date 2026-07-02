export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0đ';
  return `${value.toLocaleString('vi-VN')}đ`;
};

export const formatPriceRange = (min: number | null | undefined, max: number | null | undefined): string => {
  const hasMin = min !== null && min !== undefined;
  const hasMax = max !== null && max !== undefined;
  if (!hasMin && !hasMax) return 'Liên hệ';
  if (hasMin && !hasMax) return `Từ ${formatCurrency(min!)}`;
  if (!hasMin && hasMax) return `Đến ${formatCurrency(max!)}`;
  return `${min!.toLocaleString('vi-VN')} - ${max!.toLocaleString('vi-VN')}đ`;
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    return dateString;
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return dateString;
  }
};
