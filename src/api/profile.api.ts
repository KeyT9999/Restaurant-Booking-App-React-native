import { apiClient } from './client';
import { User } from '../types/user.types';

export interface UpdateMyProfilePayload {
  fullName: string;
  phoneNumber: string | null;
  address: string | null;
}

export interface ChangeMyPasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const profileApi = {
  getMyProfile: async (): Promise<User> => {
    const response = await apiClient.get('/users/me');
    return response.data.user;
  },

  updateMyProfile: async (payload: UpdateMyProfilePayload): Promise<{ message: string; user: User }> => {
    const response = await apiClient.put('/users/me', payload);
    return {
      message: response.data.message,
      user: response.data.user,
    };
  },

  changeMyPassword: async (payload: ChangeMyPasswordPayload): Promise<{ message: string }> => {
    const response = await apiClient.put('/users/me/password', payload);
    return {
      message: response.data.message,
    };
  },
};
