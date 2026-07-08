import { apiClient } from './client';
import { AuthResponse } from '../types/user.types';

export const authApi = {
  login: async (username: string, password: string): Promise<any> => {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data;
  },

  register: async (payload: any): Promise<any> => {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  },

  forgotPassword: async (email: string): Promise<any> => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (payload: any): Promise<any> => {
    const response = await apiClient.post('/auth/reset-password', payload);
    return response.data;
  },

  verifyEmail: async (token: string): Promise<any> => {
    const response = await apiClient.get('/auth/verify-email', { params: { token } });
    return response.data;
  },

  resendVerification: async (email: string): Promise<any> => {
    const response = await apiClient.post('/auth/resend-verification', { email });
    return response.data;
  },

  getProfile: async (): Promise<any> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  logout: async (): Promise<any> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  loginGoogleMobile: async (token: string, tokenType: 'access' | 'id' = 'access'): Promise<any> => {
    const response = await apiClient.post('/auth/google/mobile', { token, tokenType });
    return response.data;
  },
};
