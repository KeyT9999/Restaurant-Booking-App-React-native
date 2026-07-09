import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin.api';

export const useAdminRestaurants = (initialParams: any = {}) => {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<any>(initialParams);

  const fetchRestaurants = useCallback(async (currentParams = params, currentPage = page) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminApi.getRestaurants({ ...currentParams, page: currentPage });
      
      if (response?.success) {
        if (currentPage === 1) {
          setData(response.data.restaurants || []);
        } else {
          setData(prev => [...prev, ...(response.data.restaurants || [])]);
        }
        setTotal(response.data.total || 0);
      } else {
        throw new Error(response?.message || 'Lỗi khi tải danh sách nhà hàng');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách nhà hàng');
    } finally {
      setLoading(false);
    }
  }, [params, page]);

  useEffect(() => {
    fetchRestaurants(params, page);
  }, [fetchRestaurants, params, page]);

  const loadMore = () => {
    if (!loading && data.length < total) {
      setPage(prev => prev + 1);
    }
  };

  const refresh = () => {
    setPage(1);
    // fetchRestaurants will be triggered by useEffect since page changed, or we can just call it
    if (page === 1) {
      fetchRestaurants(params, 1);
    }
  };

  const updateParams = (newParams: any) => {
    setParams({ ...params, ...newParams });
    setPage(1);
  };

  const changeStatus = async (id: string, action: 'approve' | 'reject' | 'suspend' | 'unsuspend' | 'restore') => {
    try {
      const res = await adminApi.updateRestaurantStatus(id, action);
      if (res?.success) {
        // Update local state to reflect the change
        setData(prev => prev.map(rest => {
          if (rest._id === id || rest.id === id) {
            return { ...rest, approvalStatus: res.data?.approvalStatus || rest.approvalStatus };
          }
          return rest;
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  return {
    data,
    total,
    loading,
    error,
    refresh,
    loadMore,
    updateParams,
    changeStatus,
  };
};
