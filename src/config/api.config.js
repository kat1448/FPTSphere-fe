// src/config/api.config.js

// Backend API URL
export const API_BASE_URL = 'https://localhost:7273/api';

// Google Client ID
export const GOOGLE_CLIENT_ID = '563522518159-p6uhea7qfppk9na1vumqpb5ctaqk421s.apps.googleusercontent.com';

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    GOOGLE_LOGIN: '/auth/google-login',
    TEST: '/auth/test'
  }
};

// Storage Keys
// ✅ FIXED - Use simple 'token' and 'user' keys
export const STORAGE_KEYS = {
  TOKEN: 'token',      // ← ĐỔI từ 'jwt_token' thành 'token'
  USER: 'user'         // ← ĐỔI từ 'user_info' thành 'user'
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'Admin',
  DIRECTOR: 'Director',
  EVENT_MANAGER: 'Event Manager',
  STAFF: 'Staff',
  STUDENT: 'Student'
};