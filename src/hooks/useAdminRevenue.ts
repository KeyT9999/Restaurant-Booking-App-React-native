import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin.api';

export const useAdminRevenue = (initialParams: any = {}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<any>(initialParams);

  const fetchRevenue = useCallback(async (currentParams = params) => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getRevenue(currentParams);
      if (response?.success) {
        setData(response.data);
      } else {
        throw new Error(response?.message || 'Lỗi khi tải dữ liệu doanh thu');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải dữ liệu doanh thu');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchRevenue(params);
  }, [fetchRevenue, params]);

  const refresh = () => fetchRevenue(params);

  const updateParams = (newParams: any) => {
    setParams({ ...params, ...newParams });
  };

  return { data, loading, error, refresh, updateParams };
};
