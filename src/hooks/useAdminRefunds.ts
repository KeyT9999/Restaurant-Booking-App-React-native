import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin.api';

export const useAdminRefunds = (initialParams: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<any>(initialParams);

  const fetchRefunds = useCallback(async (currentParams = params, currentPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getRefunds({ ...currentParams, page: currentPage, limit: 20 });
      if (response?.success) {
        // API returns: { success, data: [], pagination: {} }
        const items = Array.isArray(response.data) ? response.data : (response.data?.refunds || []);
        if (currentPage === 1) {
          setData(items);
        } else {
          setData(prev => [...prev, ...items]);
        }
        setTotal(response.pagination?.total || response.data?.total || items.length);
      } else {
        throw new Error(response?.message || 'Lỗi khi tải danh sách hoàn tiền');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách hoàn tiền');
    } finally {
      setLoading(false);
    }
  }, [params, page]);

  useEffect(() => {
    fetchRefunds(params, page);
  }, [fetchRefunds, params, page]);

  const loadMore = () => {
    if (!loading && data.length < total) setPage(prev => prev + 1);
  };

  const refresh = () => {
    if (page === 1) fetchRefunds(params, 1);
    else setPage(1);
  };

  const updateParams = (newParams: any) => {
    setParams({ ...params, ...newParams });
    setPage(1);
  };

  const processRefund = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await adminApi.updateRefundStatus(id, action);
      if (res?.success) {
        setData(prev => prev.map(r =>
          (r._id === id || r.id === id) ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r
        ));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return { data, total, loading, error, refresh, loadMore, updateParams, processRefund };
};
