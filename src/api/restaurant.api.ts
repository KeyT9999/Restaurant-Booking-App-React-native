import { apiClient } from './client';

export const restaurantApi = {
  getRestaurants: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/restaurants', { params });
    return response.data;
  },

  getCuisineTypes: async (): Promise<any> => {
    const response = await apiClient.get('/restaurants/cuisine-types');
    return response.data;
  },

  getById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/restaurants/${id}`);
    return response.data;
  },

  getMenu: async (id: string, params?: any): Promise<any> => {
    const response = await apiClient.get(`/restaurants/${id}/menu`, { params });
    return response.data;
  },

  getMenuCategories: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/restaurants/${id}/menu-categories`);
    return response.data;
  },

  getTables: async (id: string, params?: { date?: string; timeSlot?: string }): Promise<any> => {
    const response = await apiClient.get(`/restaurants/${id}/tables`, { params });
    return response.data;
  },

  getReviews: async (id: string, params?: { page?: number; limit?: number; sort?: string }): Promise<any> => {
    const response = await apiClient.get(`/restaurants/${id}/reviews`, { params });
    return response.data;
  },

  getRatingSummary: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/restaurants/${id}/rating-summary`);
    return response.data;
  },
};
