import { apiClient } from './client';
import { BookEatWallet, WalletPagination, WalletTransaction } from '../types/wallet.types';

export const walletApi = {
  getMyWallet: async (): Promise<{ success: boolean; data: { wallet: BookEatWallet } }> => {
    const response = await apiClient.get('/wallet');
    return response.data;
  },

  getTransactions: async (params: { page?: number; limit?: number; type?: string } = {}): Promise<{
    success: boolean;
    data: { transactions: WalletTransaction[]; pagination: WalletPagination };
  }> => {
    const response = await apiClient.get('/wallet/transactions', { params });
    return response.data;
  },
};

export default walletApi;
