import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin.api';

export const useAdminDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dashboardRes, bookingStatsRes, monetizationRes, pendingWithdrawalsRes, pendingRefundsRes] = await Promise.all([
        adminApi.getDashboard().catch(() => null),
        adminApi.getBookingStats().catch(() => null),
        adminApi.getMonetizationSummary().catch(() => null),
        adminApi.getWithdrawals({ status: 'pending', limit: 1 }).catch(() => null),
        adminApi.getRefunds({ status: 'pending', limit: 1 }).catch(() => null),
      ]);

      const dashboardData = dashboardRes?.data || {};
      const bookingData = bookingStatsRes?.data || {};
      const monetizationData = monetizationRes?.data || {};
      const pendingWithdrawalsCount = pendingWithdrawalsRes?.pagination?.total || 0;
      const pendingRefundsCount = pendingRefundsRes?.pagination?.total || 0;

      setData({
        overview: dashboardData.overview || {},
        restaurantStats: dashboardData.restaurantStats || {},
        registrationTrend: dashboardData.registrationTrend || [],
        recentUsers: dashboardData.recentUsers || [],
        bookingStats: bookingData,
        monetization: monetizationData,
        pendingWithdrawalsCount,
        pendingRefundsCount,
      });
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData,
  };
};
