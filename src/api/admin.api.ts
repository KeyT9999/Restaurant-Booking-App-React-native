import { apiClient } from './client';

export const adminApi = {
  getDashboard: async (): Promise<any> => {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  },

  getBookingStats: async (): Promise<any> => {
    const response = await apiClient.get('/admin/bookings/stats');
    return response.data;
  },

  getBookings: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/admin/bookings', { params });
    return response.data;
  },

  getMonetizationSummary: async (): Promise<any> => {
    const response = await apiClient.get('/admin/monetization/summary');
    return response.data;
  },

  getUsers: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },
  
  getUserById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },
  
  createUser: async (data: any): Promise<any> => {
    const response = await apiClient.post('/admin/users', data);
    return response.data;
  },
  
  updateUser: async (id: string, data: any): Promise<any> => {
    const response = await apiClient.put(`/admin/users/${id}`, data);
    return response.data;
  },
  
  toggleUserStatus: async (id: string, data?: { active?: boolean }): Promise<any> => {
    const response = await apiClient.patch(`/admin/users/${id}/status`, data);
    return response.data;
  },
  
  resetUserPassword: async (id: string, data: { newPassword: string }): Promise<any> => {
    const response = await apiClient.patch(`/admin/users/${id}/password`, data);
    return response.data;
  },

  getRestaurants: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/admin/restaurants', { params });
    return response.data;
  },

  getRestaurantById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/admin/restaurants/${id}`);
    return response.data;
  },

  updateRestaurantStatus: async (id: string, action: 'approve' | 'reject' | 'suspend' | 'unsuspend' | 'restore', data?: any): Promise<any> => {
    const response = await apiClient.put(`/admin/restaurants/${id}/${action}`, data);
    return response.data;
  },

  getRevenue: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/admin/revenue', { params });
    return response.data;
  },

  getRefunds: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/admin/refunds', { params });
    return response.data;
  },

  getWithdrawals: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/admin/withdrawals', { params });
    return response.data;
  },

  approveWithdrawal: async (id: string): Promise<any> => {
    const response = await apiClient.patch(`/admin/withdrawals/${id}/approve`);
    return response.data;
  },

  rejectWithdrawal: async (id: string, reason?: string): Promise<any> => {
    const response = await apiClient.patch(`/admin/withdrawals/${id}/reject`, { adminNote: reason });
    return response.data;
  },

  completeWithdrawal: async (id: string, data?: { proofImage?: string, adminNote?: string }): Promise<any> => {
    const response = await apiClient.patch(`/admin/withdrawals/${id}/complete`, data);
    return response.data;
  },

  uploadImage: async (formData: FormData): Promise<any> => {
    const response = await apiClient.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateRefundStatus: async (id: string, action: 'approve' | 'reject', data?: any): Promise<any> => {
    const response = await apiClient.patch(`/admin/refunds/${id}/${action}`, data);
    return response.data;
  },

  getVouchers: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/vouchers/admin/list', { params });
    return response.data;
  },
  
  createVoucher: async (data: any): Promise<any> => {
    const response = await apiClient.post('/vouchers/admin/vouchers', data);
    return response.data;
  },
};
