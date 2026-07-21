import { apiClient } from './client';

export const paymentApi = {
  createPayment: async (payload: { targetType: 'booking' | 'subscription'; targetId: string; planCode?: string; useWalletBalance?: boolean }): Promise<any> => {
    const response = await apiClient.post('/payments/create', payload);
    return response.data;
  },

  getPaymentDetail: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/payments/${id}`);
    return response.data;
  },

  checkStatus: async (orderCode: number | string): Promise<any> => {
    const response = await apiClient.get(`/payments/check-status/${orderCode}`);
    return response.data;
  },

  cancelPayment: async (id: string): Promise<any> => {
    const response = await apiClient.post(`/payments/${id}/cancel`);
    return response.data;
  },
};
export default paymentApi;
