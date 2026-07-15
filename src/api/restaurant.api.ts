import { apiClient } from './client';
import { MenuCategory, MenuItem, RestaurantMenuResponse } from '../types/restaurant.types';

const normalizeMenuItem = (item: any): MenuItem => ({
  id: item?.id || item?._id || '',
  restaurantId: item?.restaurantId || '',
  name: item?.name || '',
  description: item?.description ?? null,
  price: Number(item?.price ?? 0),
  image: item?.image ?? null,
  category: item?.category || item?.categoryName || item?.category?.name || '',
  categoryId: item?.categoryId || item?.category?._id || null,
  categoryName: item?.categoryName || item?.category?.name || item?.category || null,
  active: item?.active ?? item?.isAvailable ?? item?.status !== 'hidden',
  isAvailable: item?.isAvailable ?? item?.active ?? true,
  status: item?.status || null,
});

const normalizeMenuCategory = (category: any): MenuCategory => ({
  id: category?.id || category?._id || category?.name,
  _id: category?._id,
  name: category?.name || '',
  description: category?.description ?? null,
});

const normalizeMenuResponse = (payload: any): any => {
  const rawData = payload?.data ?? {};
  const rawItems = Array.isArray(rawData.menuItems)
    ? rawData.menuItems
    : Array.isArray(rawData.items)
      ? rawData.items
      : [];
  const rawCategories = Array.isArray(rawData.categories) ? rawData.categories : [];

  const normalizedData: RestaurantMenuResponse = {
    menuItems: rawItems.map(normalizeMenuItem),
    items: rawItems.map(normalizeMenuItem),
    categories: rawCategories.map(normalizeMenuCategory),
  };

  return {
    ...payload,
    data: {
      ...rawData,
      ...normalizedData,
    },
  };
};

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
    if (__DEV__) {
      console.log('[restaurantApi.getById]', { id, endpoint: `/restaurants/${id}` });
    }
    const response = await apiClient.get(`/restaurants/${id}`);
    return response.data;
  },

  getMenu: async (id: string, params?: any): Promise<any> => {
    const response = await apiClient.get(`/restaurants/${id}/menu`, { params });
    return normalizeMenuResponse(response.data);
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
