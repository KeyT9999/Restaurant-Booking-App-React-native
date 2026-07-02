import { apiClient } from './client';

export const notificationApi = {
  getUnreadCount: async (): Promise<any> => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  getList: async (params?: { page?: number; limit?: number }): Promise<any> => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  markAsRead: async (id: string): Promise<any> => {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<any> => {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data;
  },

  delete: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  },
};
