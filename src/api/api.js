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
  withCredentials: true, // FIX #4/#9: cookie is the single source of auth
});

// ── Request: no token header — httpOnly cookie carries the session ──
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: unify errors + per-message toast throttle ──
const TOAST_THROTTLE_MS = 1500;
const recentToasts = new Map();

// FIX #10: throttle per message, not globally
const toastOnce = (message, type = 'error') => {
  const now = Date.now();
  const last = recentToasts.get(message) ?? 0;
  if (now - last < TOAST_THROTTLE_MS) return;
  recentToasts.set(message, now);
  // prune occasionally so the map doesn't grow unbounded
  if (recentToasts.size > 50) {
    for (const [k, t] of recentToasts) {
      if (now - t > TOAST_THROTTLE_MS) recentToasts.delete(k);
    }
  }
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

    // Auth errors
    if (status === 401) {
      const url = error.config?.url || '';
      const isAuthAttempt =
        url.includes('/auth/login') || url.includes('/auth/signup');
      if (!isAuthAttempt) {
        // FIX #5: clear the cookie server-side too (fire-and-forget)
        api.post('/api/auth/logout').catch(() => {});
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      return Promise.reject(error);
    }

    if (status === 403) {
      toastOnce(data.error || data.message || 'You do not have permission');
      return Promise.reject(error);
    }

    if (status === 404) {
      return Promise.reject(error); // quiet — often expected
    }

    if (status >= 500) {
      toastOnce(data.message || 'Server error — please try again later');
      return Promise.reject(error);
    }

    // 400 / 422
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