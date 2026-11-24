import axios from 'axios';
import { queryClient } from './queryClient';

export const TOKEN_STORAGE_KEY = 'placesync_token';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: on 401 from any endpoint except login/register, clear token and redirect
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';

    // Ignore 401 from login/register requests so login forms can display error messages
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isAuthRoute) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      queryClient.clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
