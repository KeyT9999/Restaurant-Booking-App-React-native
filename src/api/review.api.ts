import { apiClient } from './client';

export const reviewApi = {
  getRestaurantReviews: async (restaurantId: string, params?: { page?: number; limit?: number; sort?: string }): Promise<any> => {
    const response = await apiClient.get(`/reviews/restaurant/${restaurantId}`, { params });
    return response.data;
  },

  getRatingSummary: async (restaurantId: string): Promise<any> => {
    const response = await apiClient.get(`/reviews/restaurant/${restaurantId}/rating-summary`);
    return response.data;
  },

  createReview: async (payload: { bookingId: string; restaurantId: string; rating: number; comment: string; images?: string[] }): Promise<any> => {
    const response = await apiClient.post('/reviews', payload);
    return response.data;
  },

  getMyReviews: async (): Promise<any> => {
    const response = await apiClient.get('/reviews/my-reviews');
    return response.data;
  },

  updateReview: async (id: string, payload: { rating?: number; comment?: string }): Promise<any> => {
    const response = await apiClient.put(`/reviews/${id}`, payload);
    return response.data;
  },

  deleteReview: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/reviews/${id}`);
    return response.data;
  },

  toggleHelpful: async (id: string): Promise<any> => {
    const response = await apiClient.post(`/reviews/${id}/helpful`);
    return response.data;
  },

  reportReview: async (id: string, reason: string): Promise<any> => {
    const response = await apiClient.post(`/reviews/${id}/report`, { reason });
    return response.data;
  },
};
export default reviewApi;
