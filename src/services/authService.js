// services/authService.js
import api from '../api/api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

// ── Token helpers ──────────────────────────────────────
const saveSession = (token, user) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const getToken = () => localStorage.getItem(TOKEN_KEY);

const getCachedUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ── Signup ─────────────────────────────────────────────
const signup = async ({ name, email, password, username, phone, role = 'user', profile } = {}) => {
  const res = await api.post('/api/auth/signup', {
    name,
    email,
    password,
    username,
    phone,
    role,
    profile,
  });

  // Backend does NOT return a token on signup — user must log in
  return res.data;
};

// ── Login ──────────────────────────────────────────────
const login = async ({ email, password }) => {
  const res = await api.post('/api/auth/login', { email, password });

  const { data: token, user } = res.data;
  if (token) saveSession(token, user);
  return { token, user };
};

// ── Logout ─────────────────────────────────────────────
const logout = async () => {
  try {
    await api.post('/api/auth/logout');
  } catch {
    // ignore — clear locally anyway
  } finally {
    clearSession();
  }
};

// ── Profile ────────────────────────────────────────────
const getProfile = async () => {
  const res = await api.get('/api/auth/profile');
  const user = res.data?.user || null;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
};

// ── Debug (dev only) ───────────────────────────────────
const debugToken = async () => {
  const res = await api.get('/api/auth/debug-token');
  return res.data;
};

// ── Auth state helpers ─────────────────────────────────
const isAuthenticated = () => !!getToken();

export {
  signup,
  login,
  logout,
  getProfile,
  debugToken,
  getToken,
  getCachedUser,
  isAuthenticated,
  clearSession,
};

export default {
  signup,
  login,
  logout,
  getProfile,
  debugToken,
  getToken,
  getCachedUser,
  isAuthenticated,
  clearSession,
};