import apiClient, { API_ENDPOINTS } from './api';
import { jwtDecode } from 'jwt-decode';

class AuthService {
  /**
   * Login with Google OAuth token
   * AUTO-APPROVE MODE: Skip authorization check
   */
  async loginWithGoogle(credential) {
    try {
      console.log('🔐 Sending ID token to backend for verification...');
      
      const response = await apiClient.post(API_ENDPOINTS.AUTH.GOOGLE_LOGIN, {
        idToken: credential
      });

      console.log('📦 Backend response:', response.data);

      if (response.data.success) {
        // Handle both response formats
        let token, user;
        
        if (response.data.data) {
          // Format 1: Wrapped in data
          token = response.data.data.token;
          user = response.data.data.user;
        } else {
          // Format 2: Direct properties (your backend)
          token = response.data.token;
          user = response.data.user;
        }
        
        // Validate response data
        if (!token || !user) {
          throw new Error('Invalid response from server: missing token or user');
        }

        // ⭐ SKIP AUTHORIZATION CHECK
        // In auto-approve mode, all Google users are allowed
        // Backend should handle authorization automatically
        
        // Store token and user data
        this.setSession(token, user);
        
        console.log('✅ Session created successfully');
        console.log('👤 User:', user.fullName);
        console.log('📧 Email:', user.email);
        console.log('🎭 Role:', user.roleName);
        
        return {
          success: true,
          user: user,
          token: token
        };
      }
      
      throw new Error(response.data.message || 'Login failed');
    } catch (error) {
      console.error('❌ Google login error:', error);
      
      // 🔍 Debug: Log the full error response
      console.log('📋 Error response status:', error.response?.status);
      console.log('📋 Error response data:', error.response?.data);
      console.log('📋 Error message:', error.message);
      
      // ⭐ PRIORITY 1: Check backend message FIRST
      // Backend returns specific error messages in response.data
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      // Check alternative property name (capital M)
      if (error.response?.data?.Message) {
        throw new Error(error.response.data.Message);
      }
      
      // ⭐ PRIORITY 2: Fallback to status-based generic messages
      if (error.response?.status === 404) {
        throw new Error('This Google account is not found in database. Please contact admin.');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please try again.');
      }
      
      if (error.response?.status === 400) {
        throw new Error('Invalid request. Please check your input.');
      }
      
      // ⭐ PRIORITY 3: Generic error message
      throw new Error(
        error.message ||
        'Failed to login with Google. Please try again.'
      );
    }
  }

  /**
   * Set user session
   */
  setSession(token, user) {
    if (token && user) {
      localStorage.setItem('access_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('💾 Session data saved to localStorage');
      
      // Dispatch custom event to update Header and other components
      window.dispatchEvent(new Event('auth-change'));
    }
  }

  /**
   * Clear session
   */
  clearSession() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    console.log('🗑️ Session cleared');
    
    // Dispatch custom event to update Header and other components
    window.dispatchEvent(new Event('auth-change'));
  }

  /**
   * Logout user
   */
  logout() {
    this.clearSession();
    window.location.href = '/login';
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  /**
   * Get access token
   */
  getToken() {
    return localStorage.getItem('access_token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        console.log('⏰ Token expired, clearing session');
        this.clearSession();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      this.clearSession();
      return false;
    }
  }

  /**
   * Get user role
   */
  getUserRole() {
    const user = this.getCurrentUser();
    return user?.roleName || null;
  }

  /**
   * Check if user has specific role
   */
  hasRole(roles) {
    const userRole = this.getUserRole();
    if (!userRole) return false;

    if (Array.isArray(roles)) {
      return roles.includes(userRole);
    }
    
    return userRole === roles;
  }

  /**
   * Check if user is authorized
   * In auto-approve mode, always return true for logged-in users
   */
  isAuthorized() {
    return this.isAuthenticated();
  }
}

const authService = new AuthService();
export default authService;