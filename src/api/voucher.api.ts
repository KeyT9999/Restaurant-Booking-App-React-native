import { apiClient } from './client';

export const voucherApi = {
  validateVoucher: async (payload: { code: string; restaurantId: string; orderAmount: number }): Promise<any> => {
    const response = await apiClient.post('/vouchers/validate', payload);
    return response.data;
  },

  getById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/vouchers/${id}`);
    return response.data;
  },

  saveVoucher: async (voucherId: string): Promise<any> => {
    const response = await apiClient.post('/vouchers/save', { voucherId });
    return response.data;
  },

  unsaveVoucher: async (voucherId: string): Promise<any> => {
    const response = await apiClient.delete(`/vouchers/unsave/${voucherId}`);
    return response.data;
  },

  getMyVouchers: async (params?: { filter?: string }): Promise<any> => {
    const response = await apiClient.get('/vouchers/my-vouchers', { params });
    return response.data;
  },

  getRestaurantVouchers: async (restaurantId: string): Promise<any> => {
    const response = await apiClient.get(`/vouchers/restaurant/${restaurantId}`);
    return response.data;
  },

  getPlatformVouchers: async (params?: { page?: number; limit?: number }): Promise<any> => {
    const response = await apiClient.get('/vouchers/platform', { params });
    return response.data;
  },
};
export default voucherApi;
