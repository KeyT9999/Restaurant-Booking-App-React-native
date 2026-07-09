import axios from 'axios';
import { getToken, clearToken } from '../auth/token';
import * as SecureStore from 'expo-secure-store';

const IP_CONFIG_KEY = 'bookeat_api_base_url';

export const getCustomBaseURL = async (): Promise<string> => {
  try {
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    const customUrl = await SecureStore.getItemAsync(IP_CONFIG_KEY);
    // If stored URL is localhost but we have a real env URL, clear the stale cache
    if (customUrl && customUrl.includes('localhost') && envUrl && !envUrl.includes('localhost')) {
      await SecureStore.deleteItemAsync(IP_CONFIG_KEY);
      return envUrl;
    }
    return customUrl || envUrl || 'http://localhost:3001/api/v1';
  } catch (e) {
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  }
};

export const setCustomBaseURL = async (url: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(IP_CONFIG_KEY, url);
    apiClient.defaults.baseURL = url;
  } catch (e) {
    console.error('Error saving custom API URL', e);
  }
};

export const initApiClient = async (): Promise<string> => {
  try {
    const url = await getCustomBaseURL();
    apiClient.defaults.baseURL = url;
    return url;
  } catch (e) {
    return apiClient.defaults.baseURL || '';
  }
};

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: tự động đính kèm token nếu có
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export const addUnauthorizedListener = (listener: UnauthorizedListener) => {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
};

export const emitUnauthorized = () => {
  unauthorizedListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.warn('Error triggering unauthorized listener:', e);
    }
  });
};

// Response interceptor: tự động xử lý lỗi 401 (hết hạn token)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Nếu token hết hạn hoặc không hợp lệ, xóa token và yêu cầu login lại
    if (error.response?.status === 401) {
      await clearToken();
      emitUnauthorized();
    }
    return Promise.reject(error);
  }
);
