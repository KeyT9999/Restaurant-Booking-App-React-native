import { apiClient } from './client';

export const favoriteApi = {
  addFavorite: async (restaurantId: string): Promise<any> => {
    const response = await apiClient.post('/customer/favorites', { restaurantId });
    return response.data;
  },

  removeFavorite: async (restaurantId: string): Promise<any> => {
    const response = await apiClient.delete(`/customer/favorites/${restaurantId}`);
    return response.data;
  },

  getMyFavorites: async (): Promise<any> => {
    const response = await apiClient.get('/customer/favorites');
    return response.data;
  },

  getFavoriteIds: async (): Promise<any> => {
    const response = await apiClient.get('/customer/favorites/ids');
    return response.data;
  },
};
export default favoriteApi;
