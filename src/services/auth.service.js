// src/services/auth.service.js

import apiClient from './api.service';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';

export const authService = {
  loginWithGoogle: async (idToken) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.GOOGLE_LOGIN, {
        idToken: idToken
      });
      
      const { success, message, token, user } = response.data;
      
      if (success && token && user) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        return { success: true, user };
      } else {
        return { success: false, message };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi khi đăng nhập';
      return { success: false, message: errorMessage };
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  isAuthenticated: () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const user = authService.getCurrentUser();
    return !!(token && user);
  }
};

export default authService;