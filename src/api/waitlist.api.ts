import { apiClient } from './client';

export interface JoinWaitlistPayload {
  restaurantId: string;
  preferredDate: string;
  preferredTime: string;
  numberOfGuests: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  note?: string;
  maxWaitMinutes?: number;
}

export const waitlistApi = {
  // Join restaurant waitlist queue
  async joinWaitlist(payload: JoinWaitlistPayload) {
    const res = await apiClient.post('/waitlists', payload);
    return res.data;
  },

  // Get current active customer waitlists
  async getMyWaitlists(params?: { page?: number; limit?: number; status?: string }) {
    const res = await apiClient.get('/waitlists/my', { params });
    return res.data;
  },

  // Get specific waitlist status/details
  async getWaitlistById(id: string) {
    const res = await apiClient.get(`/waitlists/${id}`);
    return res.data;
  },

  // Leave / cancel waitlist request
  async cancelWaitlist(id: string, reason?: string) {
    const res = await apiClient.delete(`/waitlists/${id}/cancel`, {
      data: { reason },
    });
    return res.data;
  },
};
