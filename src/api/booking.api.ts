import { apiClient } from './client';
import { BookingPayload, CancellationPreview, CancellationResult } from '../types/booking.types';

export const bookingApi = {
  checkAvailability: async (payload: { restaurantId: string; bookingDate: string; bookingTime: string; numberOfGuests: number }): Promise<any> => {
    const response = await apiClient.post('/bookings/availability-check', payload);
    return response.data;
  },

  holdTables: async (payload: { restaurantId: string; bookingDate: string; bookingTime: string; tableNumbers: string[] }): Promise<any> => {
    const response = await apiClient.post('/bookings/hold-tables', payload);
    return response.data;
  },

  releaseHolds: async (payload: { restaurantId: string; bookingDate: string; bookingTime: string }): Promise<any> => {
    const response = await apiClient.post('/bookings/release-holds', payload);
    return response.data;
  },

  createBooking: async (payload: BookingPayload): Promise<any> => {
    const response = await apiClient.post('/bookings', payload);
    return response.data;
  },

  getMyBookings: async (params?: { filter?: 'all' | 'upcoming' | 'past' | 'cancelled'; page?: number; limit?: number }): Promise<any> => {
    const response = await apiClient.get('/bookings/my', { params });
    return response.data;
  },

  getById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data;
  },

  getCancellationPreview: async (id: string): Promise<{ success: boolean; data: CancellationPreview }> => {
    const response = await apiClient.get(`/bookings/${id}/cancellation-preview`);
    return response.data;
  },

  cancelBooking: async (id: string, reason: string): Promise<{ success: boolean; message?: string; data: CancellationResult }> => {
    const response = await apiClient.post(`/bookings/${id}/cancel`, { reason });
    return response.data;
  },
};
export default bookingApi;
