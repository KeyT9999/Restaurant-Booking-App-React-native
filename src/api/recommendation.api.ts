import { apiClient } from './client';

export const recommendationApi = {
  getHome: async (params?: { lat?: number; lng?: number; limit?: number }): Promise<any> => {
    const response = await apiClient.get('/recommendations/home', { params });
    return response.data;
  },

  getRestaurants: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/recommendations/restaurants', { params });
    return response.data;
  },

  getMenuItems: async (restaurantId: string): Promise<any> => {
    const response = await apiClient.get('/recommendations/menu-items', { params: { restaurantId } });
    return response.data;
  },
};
