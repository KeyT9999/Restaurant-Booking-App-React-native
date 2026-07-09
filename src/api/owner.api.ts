import { apiClient } from './client';

export const ownerApi = {
  // ─── Restaurants ───
  getMyRestaurants: async (): Promise<any> => {
    const res = await apiClient.get('/owner/restaurants');
    return res.data;
  },

  getRestaurantDashboard: async (restaurantId: string): Promise<any> => {
    const res = await apiClient.get(`/owner/restaurants/${restaurantId}/dashboard`);
    return res.data;
  },

  // ─── Bookings ───
  getBookings: async (
    restaurantId: string,
    params?: { status?: string; search?: string; page?: number; limit?: number }
  ): Promise<any> => {
    const res = await apiClient.get('/owner/bookings', { params: { restaurantId, ...params } });
    return res.data;
  },

  getBookingDetail: async (id: string): Promise<any> => {
    const res = await apiClient.get(`/owner/bookings/${id}`);
    return res.data;
  },

  confirmBooking: async (id: string): Promise<any> => {
    const res = await apiClient.put(`/owner/bookings/${id}/confirm`);
    return res.data;
  },

  cancelBooking: async (id: string, reason: string): Promise<any> => {
    const res = await apiClient.put(`/owner/bookings/${id}/cancel`, { reason });
    return res.data;
  },

  completeBooking: async (id: string, actualGuestCount?: number): Promise<any> => {
    const res = await apiClient.put(`/owner/bookings/${id}/complete`, { actualGuestCount });
    return res.data;
  },

  markNoShow: async (id: string): Promise<any> => {
    const res = await apiClient.put(`/owner/bookings/${id}/no-show`);
    return res.data;
  },

  getAvailableTables: async (id: string): Promise<any> => {
    const res = await apiClient.get(`/owner/bookings/${id}/available-tables`);
    return res.data;
  },

  changeTable: async (id: string, newTableNumbers: string[]): Promise<any> => {
    const res = await apiClient.put(`/owner/bookings/${id}/change-table`, { newTableNumbers });
    return res.data;
  },

  addInternalNote: async (id: string, content: string): Promise<any> => {
    const res = await apiClient.post(`/owner/bookings/${id}/internal-notes`, { content });
    return res.data;
  },

  deleteInternalNote: async (id: string): Promise<any> => {
    const res = await apiClient.delete(`/owner/bookings/${id}/internal-notes`);
    return res.data;
  },

  getBookingStats: async (restaurantId: string, period?: string): Promise<any> => {
    const res = await apiClient.get('/owner/bookings/stats', { params: { restaurantId, period } });
    return res.data;
  },

  getRevenueStats: async (restaurantId: string, period?: string): Promise<any> => {
    const res = await apiClient.get('/owner/bookings/revenue-stats', { params: { restaurantId, period } });
    return res.data;
  },

  // ─── Menu ───
  getCategories: async (restaurantId: string): Promise<any> => {
    const res = await apiClient.get(`/owner/restaurants/${restaurantId}/menu-categories`);
    return res.data;
  },

  createCategory: async (restaurantId: string, data: { name: string; description?: string }): Promise<any> => {
    const res = await apiClient.post(`/owner/restaurants/${restaurantId}/menu-categories`, data);
    return res.data;
  },

  updateCategory: async (categoryId: string, data: { name: string; description?: string }): Promise<any> => {
    const res = await apiClient.put(`/owner/menu-categories/${categoryId}`, data);
    return res.data;
  },

  deleteCategory: async (categoryId: string): Promise<any> => {
    const res = await apiClient.delete(`/owner/menu-categories/${categoryId}`);
    return res.data;
  },

  getMenuItems: async (restaurantId: string, params?: { categoryId?: string }): Promise<any> => {
    const res = await apiClient.get(`/owner/restaurants/${restaurantId}/menu-items`, { params });
    return res.data;
  },

  createMenuItem: async (restaurantId: string, data: any): Promise<any> => {
    const res = await apiClient.post(`/owner/restaurants/${restaurantId}/menu-items`, data);
    return res.data;
  },

  updateMenuItem: async (itemId: string, data: any): Promise<any> => {
    const res = await apiClient.put(`/owner/menu-items/${itemId}`, data);
    return res.data;
  },

  deleteMenuItem: async (itemId: string): Promise<any> => {
    const res = await apiClient.delete(`/owner/menu-items/${itemId}`);
    return res.data;
  },

  toggleMenuItemAvailability: async (itemId: string, isAvailable: boolean): Promise<any> => {
    const res = await apiClient.patch(`/owner/menu-items/${itemId}/availability`, { isAvailable });
    return res.data;
  },

  // ─── Vouchers ───
  getVouchers: async (restaurantId: string, params?: any): Promise<any> => {
    const res = await apiClient.get('/vouchers/owner/list', { params: { restaurantId, ...params } });
    return res.data;
  },

  createVoucher: async (data: any): Promise<any> => {
    const res = await apiClient.post('/vouchers/owner/vouchers', data);
    return res.data;
  },

  updateVoucher: async (id: string, data: any): Promise<any> => {
    const res = await apiClient.put(`/vouchers/owner/vouchers/${id}`, data);
    return res.data;
  },

  changeVoucherStatus: async (id: string, status: 'active' | 'paused'): Promise<any> => {
    const res = await apiClient.patch(`/vouchers/owner/vouchers/${id}/status`, { status });
    return res.data;
  },

  deleteVoucher: async (id: string): Promise<any> => {
    const res = await apiClient.delete(`/vouchers/owner/vouchers/${id}`);
    return res.data;
  },

  // ─── Reviews ───
  getReviews: async (restaurantId: string, params?: any): Promise<any> => {
    const res = await apiClient.get('/owner/reviews', { params: { restaurantId, ...params } });
    return res.data;
  },

  replyReview: async (id: string, replyText: string): Promise<any> => {
    const res = await apiClient.post(`/owner/reviews/${id}/reply`, { content: replyText });
    return res.data;
  },

  // ─── Tables ───
  getTables: async (restaurantId: string, params?: any): Promise<any> => {
    const res = await apiClient.get(`/owner/restaurants/${restaurantId}/tables`, { params });
    return res.data;
  },
  createTable: async (restaurantId: string, data: any): Promise<any> => {
    const res = await apiClient.post(`/owner/restaurants/${restaurantId}/tables`, data);
    return res.data;
  },
  updateTable: async (id: string, data: any): Promise<any> => {
    const res = await apiClient.put(`/owner/tables/${id}`, data);
    return res.data;
  },
  deleteTable: async (id: string): Promise<any> => {
    const res = await apiClient.delete(`/owner/tables/${id}`);
    return res.data;
  },
  updateTableStatus: async (id: string, status: string): Promise<any> => {
    const res = await apiClient.patch(`/owner/tables/${id}/status`, { status });
    return res.data;
  },

  // ─── Blocked Slots ───
  getBlockedSlots: async (restaurantId: string): Promise<any> => {
    const res = await apiClient.get(`/owner/restaurants/${restaurantId}/blocked-slots`);
    return res.data;
  },
  createBlockedSlot: async (restaurantId: string, data: any): Promise<any> => {
    const res = await apiClient.post(`/owner/restaurants/${restaurantId}/blocked-slots`, data);
    return res.data;
  },
  deleteBlockedSlot: async (restaurantId: string, id: string): Promise<any> => {
    const res = await apiClient.delete(`/owner/restaurants/${restaurantId}/blocked-slots/${id}`);
    return res.data;
  },

  // ─── Waitlist ───
  getWaitlists: async (params?: any): Promise<any> => {
    const res = await apiClient.get('/owner/waitlists', { params });
    return res.data;
  },
  getWaitlistStats: async (params?: any): Promise<any> => {
    const res = await apiClient.get('/owner/waitlists/stats', { params });
    return res.data;
  },
  getWaitlistAvailableTables: async (id: string): Promise<any> => {
    const res = await apiClient.get(`/owner/waitlists/${id}/available-tables`);
    return res.data;
  },
  assignWaitlistTables: async (id: string, tableIds: string[]): Promise<any> => {
    const res = await apiClient.put(`/owner/waitlists/${id}/assign-tables`, { tableIds });
    return res.data;
  },
  confirmWaitlist: async (id: string, tableIds: string[], ownerNote?: string): Promise<any> => {
    const res = await apiClient.put(`/owner/waitlists/${id}/confirm`, { tableIds, ownerNote });
    return res.data;
  },
  cancelWaitlist: async (id: string, reason: string): Promise<any> => {
    const res = await apiClient.put(`/owner/waitlists/${id}/cancel`, { reason });
    return res.data;
  },

  // ─── Wallet & Finance ───
  getTransactions: async (): Promise<any> => {
    const res = await apiClient.get('/owner/billing/transactions');
    return res.data;
  },
  getWithdrawals: async (): Promise<any> => {
    const res = await apiClient.get('/owner/withdrawals');
    return res.data;
  },
  createWithdrawal: async (data: any): Promise<any> => {
    const res = await apiClient.post('/owner/withdrawals', data);
    return res.data;
  },
};
