// src/services/auth.service.js

import apiClient from './api.service';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import { getUserById } from './users.api';

export const authService = {
  loginWithGoogle: async (idToken) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.GOOGLE_LOGIN, {
        idToken: idToken
      });
      
      const { success, message, token, user } = response.data;
      
      if (success && token && user) {
        // Fetch full user details including roleId from API
        let userWithRoleId = { ...user };
        
        // Normalize roleId to number if exists
        if (userWithRoleId.roleId) {
          userWithRoleId.roleId = Number(userWithRoleId.roleId);
        }
        
        if (user.userId) {
          try {
            console.log(`📤 Fetching full user details for userId: ${user.userId}`);
            const fullUserData = await getUserById(user.userId);
            
            // Merge roleId and other details from API response
            if (fullUserData) {
              // Normalize roleId to number
              const normalizedRoleId = fullUserData.roleId ? Number(fullUserData.roleId) : null;
              
              userWithRoleId = {
                ...user,
                // Priority: Use roleId from API, fallback to login response
                roleId: normalizedRoleId || userWithRoleId.roleId || null,
                // Priority: Use roleName from login response (usually more accurate), fallback to API
                roleName: user.roleName || fullUserData.roleName || null,
                isAuthorized: fullUserData.isAuthorized !== undefined ? fullUserData.isAuthorized : user.isAuthorized,
              };
              
              console.log(`✅ User details fetched:`);
              console.log(`   - roleId: ${userWithRoleId.roleId} (type: ${typeof userWithRoleId.roleId})`);
              console.log(`   - roleName: ${userWithRoleId.roleName}`);
              console.log(`   - Full user data:`, userWithRoleId);
            }
          } catch (error) {
            console.warn('⚠️ Could not fetch full user details, using login response data:', error);
            // Continue with user data from login response
            // Ensure roleId is normalized
            if (userWithRoleId.roleId) {
              userWithRoleId.roleId = Number(userWithRoleId.roleId);
            }
          }
        }
        
        // Final check: Ensure roleId is a number
        if (userWithRoleId.roleId !== null && userWithRoleId.roleId !== undefined) {
          userWithRoleId.roleId = Number(userWithRoleId.roleId);
        }
        
        console.log(`💾 Final user data to save:`, {
          userId: userWithRoleId.userId,
          roleId: userWithRoleId.roleId,
          roleName: userWithRoleId.roleName,
          roleIdType: typeof userWithRoleId.roleId
        });
        
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithRoleId));
        return { success: true, user: userWithRoleId };
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