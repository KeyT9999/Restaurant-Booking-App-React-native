import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin.api';

export const useAdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWithdrawals = useCallback(async (status?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = status ? { status } : {};
      const res = await adminApi.getWithdrawals(params);
      setWithdrawals(res?.data || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi tải danh sách yêu cầu rút tiền');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  return { withdrawals, loading, error, refetch: fetchWithdrawals };
};
