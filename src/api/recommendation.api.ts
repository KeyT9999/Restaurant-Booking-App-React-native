import { apiClient } from './client';

const normalizeNearbyRestaurant = (item: any) => ({
  id: item.restaurantId,
  restaurantId: item.restaurantId,
  name: item.name,
  image: item.photo || null,
  cuisineTypes: item.category ? [item.category] : [],
  displayCuisineTypes: item.category ? [item.category] : [],
  priceRange: item.priceRange || null,
  priceRangeLabel: item.priceRangeText || null,
  ratingAverage: item.rating || 0,
  reviewCount: item.reviewCount || 0,
  address: item.address || '',
  distance: item.distance || null,
  distanceText: item.distanceText || null,
  reason: item.reason || null,
});

export const recommendationApi = {
  getHome: async (params?: { lat?: number; lng?: number; limit?: number }): Promise<any> => {
    const response = await apiClient.get('/recommendations/home', { params });
    const payload = response.data;

    if (params?.lat == null || params?.lng == null) {
      return payload;
    }

    try {
      const nearbyResponse = await apiClient.get('/nearby/recommend', {
        params: {
          latitude: params.lat,
          longitude: params.lng,
          limit: params.limit,
        },
      });

      const nearbyItems = nearbyResponse.data?.data?.items;
      if (Array.isArray(nearbyItems) && payload?.data) {
        const normalizedNearby = nearbyItems.map(normalizeNearbyRestaurant);

        payload.data = {
          ...payload.data,
          popularRestaurants: normalizedNearby,
          restaurantsForYou:
            Array.isArray(payload.data.restaurantsForYou) && payload.data.restaurantsForYou.length > 0
              ? payload.data.restaurantsForYou
              : normalizedNearby,
        };
      }
    } catch (error) {
      console.warn('Không thể tải gợi ý gần bạn:', error);
    }

    return payload;
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
