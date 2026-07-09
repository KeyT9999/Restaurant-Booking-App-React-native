import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin.api';

export const useAdminVouchers = (initialParams: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<any>(initialParams);

  const fetchVouchers = useCallback(async (currentParams = params, currentPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getVouchers({ ...currentParams, page: currentPage, limit: 20 });
      if (response?.success) {
        if (currentPage === 1) {
          setData(response.data.vouchers || []);
        } else {
          setData(prev => [...prev, ...(response.data.vouchers || [])]);
        }
        setTotal(response.data.total || 0);
      } else {
        throw new Error(response?.message || 'Lỗi khi tải danh sách voucher');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  }, [params, page]);

  useEffect(() => {
    fetchVouchers(params, page);
  }, [fetchVouchers, params, page]);

  const loadMore = () => {
    if (!loading && data.length < total) setPage(prev => prev + 1);
  };

  const refresh = () => {
    if (page === 1) fetchVouchers(params, 1);
    else setPage(1);
  };

  const updateParams = (newParams: any) => {
    setParams({ ...params, ...newParams });
    setPage(1);
  };

  return { data, total, loading, error, refresh, loadMore, updateParams };
};
