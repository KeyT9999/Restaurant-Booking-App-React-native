import { apiClient } from './client';
import { LoyaltyHistoryItem, LoyaltyPreview, LoyaltySummary } from '../types/loyalty.types';

const normalizeHistoryItem = (item: any): LoyaltyHistoryItem => ({
  id: item?.id || item?._id || '',
  points: Number(item?.points ?? 0),
  type: item?.type || 'admin_adjust',
  referenceId: item?.referenceId || null,
  description: item?.description || '',
  expiresAt: item?.expiresAt || null,
  isExpired: Boolean(item?.isExpired),
  createdAt: item?.createdAt || '',
  updatedAt: item?.updatedAt || '',
});

const normalizeSummary = (data: any): LoyaltySummary => ({
  loyaltyPoints: Number(data?.loyaltyPoints ?? 0),
  totalPointsEarned: Number(data?.totalPointsEarned ?? 0),
  history: Array.isArray(data?.history) ? data.history.map(normalizeHistoryItem) : [],
});

export const loyaltyApi = {
  getSummary: async (): Promise<any> => {
    const response = await apiClient.get('/loyalty/summary');
    return {
      ...response.data,
      data: normalizeSummary(response.data?.data),
    };
  },

  previewRedemption: async (depositAmount: number): Promise<{ success: boolean; data: LoyaltyPreview }> => {
    const response = await apiClient.get('/loyalty/preview', {
      params: { depositAmount },
    });
    return response.data;
  },

  simulateEarnCoins: async (amount: number, source?: 'deposit' | 'completed'): Promise<any> => {
    const response = await apiClient.post('/loyalty/simulate', { amount, source });
    return response.data;
  },
};
