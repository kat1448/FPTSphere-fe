// src/config/api.config.js

// Backend API URL
export const API_BASE_URL = "https://localhost:7273/api";

// Google Client ID
export const GOOGLE_CLIENT_ID =
  "563522518159-p6uhea7qfppk9na1vumqpb5ctaqk421s.apps.googleusercontent.com";

// Google Maps API Key (for Places Autocomplete)
// TODO: Replace with your actual Google Maps API key
// Get your API key from: https://console.cloud.google.com/google/maps-apis
export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  "AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbUUSRIAFg";

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    GOOGLE_LOGIN: "/auth/google-login",
    TEST: "/auth/test",
  },
};

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: "access_token",
  USER: "user",
};

// User Roles
export const USER_ROLES = {
  ADMIN: "Admin",
  DIRECTOR: "Director",
  EVENT_MANAGER: "Event Manager",
  STAFF: "Staff",
  STUDENT: "Student",
};
