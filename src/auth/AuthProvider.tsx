import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../api/client';
import { setToken as saveSecureToken, getToken as getSecureToken, clearToken as deleteSecureToken } from './token';
import { User } from '../types/user.types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; message: string }>;
  loginWithToken: (token: string) => Promise<{ success: boolean; message: string }>;
  register: (fullName: string, email: string, phoneNumber: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Khởi động app: kiểm tra token cũ
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Khởi tạo Base URL động từ SecureStore
        const { initApiClient } = require('../api/client');
        await initApiClient();

        const storedToken = await getSecureToken();
        if (storedToken) {
          setToken(storedToken);
          // Gọi API lấy profile để kiểm tra tính hợp lệ của token
          const response = await apiClient.get('/auth/profile', {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          if (response.data.success && response.data.user) {
            setUser(response.data.user);
          } else {
            // Token không hợp lệ hoặc hết hạn
            await deleteSecureToken();
            setToken(null);
          }
        }
      } catch (error) {
        console.warn('Initialization auth failed:', error);
        await deleteSecureToken();
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Lắng nghe sự kiện logout khi có lỗi 401 từ interceptor
    const handleUnauthorized = async () => {
      setUser(null);
      setToken(null);
      await deleteSecureToken();
    };

    const { addUnauthorizedListener } = require('../api/client');
    const unsubscribe = addUnauthorizedListener(handleUnauthorized);

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', {
        username: emailOrUsername, // Backend map email/username vào key username
        password,
      });

      if (response.data.success) {
        const { access_token, user: userData } = response.data;
        setToken(access_token);
        setUser(userData);
        await saveSecureToken(access_token);
        return { success: true, message: 'Đăng nhập thành công' };
      }
      return { success: false, message: response.data.message || 'Đăng nhập thất bại' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Kết nối máy chủ thất bại';
      return { success: false, message };
    }
  };

  const register = async (fullName: string, email: string, phoneNumber: string, password: string) => {
    try {
      // Auto-generate username duy nhất dựa trên email để khớp schema backend bắt buộc
      const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const generatedUsername = `${prefix}${randomSuffix}`.substring(0, 15);

      const response = await apiClient.post('/auth/register', {
        username: generatedUsername,
        email,
        fullName,
        phoneNumber: phoneNumber || null,
        password,
        confirmPassword: password, // confirmation
      });

      if (response.data.success) {
        return { success: true, message: response.data.message || 'Đăng ký thành công! Vui lòng xác thực email.' };
      }
      return { success: false, message: response.data.message || 'Đăng ký thất bại' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Kết nối máy chủ thất bại';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('Backend logout warning:', error);
    } finally {
      setUser(null);
      setToken(null);
      await deleteSecureToken();
    }
  };

  const loginWithToken = async (newToken: string) => {
    try {
      setToken(newToken);
      await saveSecureToken(newToken);
      // Fetch user profile
      const response = await apiClient.get('/auth/profile', {
        headers: {
          Authorization: `Bearer ${newToken}`,
        },
      });
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        return { success: true, message: 'Đăng nhập thành công' };
      }
      return { success: false, message: 'Không thể lấy thông tin tài khoản' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Lỗi xác thực OAuth';
      return { success: false, message };
    }
  };

  const refreshProfile = async () => {
    try {
      if (!token) return;
      const response = await apiClient.get('/auth/profile');
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.warn('Refresh profile failed:', error);
    }
  };

  const updateUser = (nextUser: User | null) => {
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        loginWithToken,
        register,
        logout,
        refreshProfile,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
