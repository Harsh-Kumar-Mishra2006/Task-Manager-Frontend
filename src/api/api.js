// api/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // cookie fallback (same-site in dev)
});

// ── Request: attach JWT ────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: unify errors + throttle toasts ───────────
let lastToastAt = 0;
const TOAST_THROTTLE_MS = 1500;

const toastOnce = (message, type = 'error') => {
  const now = Date.now();
  if (now - lastToastAt < TOAST_THROTTLE_MS) return;
  lastToastAt = now;
  toast[type](message);
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error('[API] error', {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    // Network-level
    if (error.code === 'ECONNABORTED') {
      toastOnce('Request timeout — please try again');
      return Promise.reject(error);
    }
    if (error.code === 'ERR_NETWORK') {
      toastOnce('Cannot connect to server. Is the backend running?');
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const data = error.response?.data || {};

    // Auth errors — handle silently, no toast spam
    if (status === 401) {
      // Only force logout if the error is NOT from the login endpoint
      const url = error.config?.url || '';
      const isLoginAttempt = url.includes('/auth/login') || url.includes('/auth/signup');
      if (!isLoginAttempt) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Don't redirect here — let the page decide (SPA-friendly)
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      return Promise.reject(error);
    }

    if (status === 403) {
      toastOnce(data.error || data.message || 'You do not have permission');
      return Promise.reject(error);
    }

    if (status === 404) {
      // Quiet — often expected (resource deleted)
      return Promise.reject(error);
    }

    if (status >= 500) {
      toastOnce(data.message || 'Server error — please try again later');
      return Promise.reject(error);
    }

    // 400 / 422 — validation errors; message from backend already friendly
    const msg =
      data.error ||
      data.message ||
      (Array.isArray(data.errors) ? data.errors[0] : null) ||
      'Something went wrong';
    toastOnce(msg);
    return Promise.reject(error);
  }
);

export default api;