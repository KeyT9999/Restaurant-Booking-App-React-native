import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin.api';

export const useAdminUsers = (initialParams: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<any>(initialParams);

  const fetchUsers = useCallback(async (currentParams = params, currentPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getUsers({ ...currentParams, page: currentPage, limit: 20 });
      if (response?.success) {
        if (currentPage === 1) {
          setData(response.data.users || []);
        } else {
          setData(prev => [...prev, ...(response.data.users || [])]);
        }
        setTotal(response.data.total || 0);
      } else {
        throw new Error(response?.message || 'Lỗi khi tải danh sách người dùng');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [params, page]);

  useEffect(() => {
    fetchUsers(params, page);
  }, [fetchUsers, params, page]);

  const loadMore = () => {
    if (!loading && data.length < total) {
      setPage(prev => prev + 1);
    }
  };

  const refresh = () => {
    if (page === 1) {
      fetchUsers(params, 1);
    } else {
      setPage(1);
    }
  };

  const updateParams = (newParams: any) => {
    setParams({ ...params, ...newParams });
    setPage(1);
  };

  const toggleStatus = async (id: string, active: boolean) => {
    try {
      const res = await adminApi.toggleUserStatus(id, { active });
      if (res?.success) {
        setData(prev => prev.map(u =>
          (u._id === id || u.id === id) ? { ...u, active } : u
        ));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return { data, total, loading, error, refresh, loadMore, updateParams, toggleStatus };
};
