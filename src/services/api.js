import axios from 'axios';

// Base API URL - Update this to match your backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7273/api';

/**
 * Axios instance with default config
 * Note: Content-Type is set per-request to avoid 415 errors
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  // Removed default Content-Type to avoid conflicts with backend
  // Content-Type will be set explicitly in each request
});

/**
 * Request interceptor - Add auth token if exists
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle common errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');

      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    GOOGLE_LOGIN: '/auth/google-login',  // ✅ Backend endpoint
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },

  // Events (Admin - Authenticated)
  EVENTS: '/events',
  EVENT_BY_ID: (id) => `/events/${id}`,
  LIST_EVENTS_MYSELF: '/events/list-events-myself',
  REGISTER_EVENT_BY_STUDENT: (eventID) => `/events/${eventID}/register`,
  CANCEL_REGISTER_EVENT_BY_STUDENT: (eventID) => `/events/${eventID}/unregister`,


  // staff 
  EVENT_TASKS: '/EventTasks/my-tasks',
  EVENT_TASK_BY_ID: (id) => `/EventTasks/${id}/status`,
  // Public Events (No Auth Required)
  PUBLIC_EVENTS: '/publicevents',
  PUBLIC_EVENT_BY_ID: (id) => `/publicevents/${id}`,

  // 🔹 Event Manager (EM)
  MY_EVENTS: '/events/my',
  MY_EVENTS_OVERVIEW: '/events/my/overview',
  MY_EVENTS_CALENDAR: '/events/my/calendar',

  // Event Statuses
  EVENT_STATUSES: '/eventstatuses',
  EVENT_STATUS_BY_ID: (id) => `/eventstatuses/${id}`,

  // Locations
  LOCATIONS: '/locations',
  LOCATION_BY_ID: (id) => `/locations/${id}`,

  // Resources
  RESOURCES: '/resources',
  RESOURCE_BY_ID: (id) => `/resources/${id}`,

  // External Locations
  EXTERNAL_LOCATIONS: '/externallocations',
  EXTERNAL_LOCATION_BY_ID: (id) => `/externallocations/${id}`,

  // Users
  USERS: '/users',
  USER_BY_ID: (id) => `/users/${id}`,

  SUBEVENTS: (eventId) => `/Events/${eventId}/subevents`,
};

export default apiClient;