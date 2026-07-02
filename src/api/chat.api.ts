import { apiClient } from './client';

export const chatApi = {
  // Get list of active conversations
  async getConversations() {
    const res = await apiClient.get('/chat/conversations');
    return res.data;
  },

  // Open or create conversation with a restaurant
  async createConversation(restaurantId: string) {
    const res = await apiClient.post('/chat/conversations', {
      restaurantId,
      type: 'CUSTOMER_RESTAURANT',
    });
    return res.data;
  },

  // Get messages of a conversation
  async getMessages(conversationId: string, params?: { page?: number; limit?: number }) {
    const res = await apiClient.get(`/chat/conversations/${conversationId}/messages`, { params });
    return res.data;
  },

  // Send a text message to a conversation
  async sendMessage(conversationId: string, content: string) {
    const res = await apiClient.post('/chat/messages', {
      conversationId,
      content,
    });
    return res.data;
  },

  // Mark all messages in a conversation as read
  async markRead(conversationId: string) {
    const res = await apiClient.patch(`/chat/conversations/${conversationId}/read`);
    return res.data;
  },

  // Get unread conversations count
  async getUnreadCount(restaurantId?: string) {
    const res = await apiClient.get('/chat/unread-count', { params: { restaurantId } });
    return res.data;
  },
};
