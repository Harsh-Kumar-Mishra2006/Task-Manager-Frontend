// services/authService.js
import api from '../api/api';

const USER_KEY = 'user';

// ── Local cache of the user object (NOT a credential) ──
// The real session lives in the httpOnly cookie. This cache just lets the
// UI paint instantly before /profile resolves.
const saveUser = (user) => {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(USER_KEY);
};

const getCachedUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ── Signup (no auto-login) ─────────────────────────────
const signup = async ({ name, email, password, username, phone, profile } = {}) => {
  // FIX #3: no `role` sent — backend forces 'user'
  const res = await api.post('/api/auth/signup', {
    name,
    email,
    password,
    username,
    phone,
    profile,
  });
  return res.data; // { success, data: { id, ... }, message }
};

// ── Login ──────────────────────────────────────────────
const login = async ({ email, password }) => {
  const res = await api.post('/api/auth/login', { email, password });
  const user = res.data?.user || null;
  if (user) saveUser(user);
  // No token to store — the cookie is set by the server
  return { user };
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
  // FIX #1: backend now returns { success, user }
  const user = res.data?.user || null;
  if (user) saveUser(user);
  return user;
};

// ── Debug (dev only) ───────────────────────────────────
const debugToken = async () => {
  const res = await api.get('/api/auth/debug-token');
  return res.data;
};

// FIX #6: auth is "does the backend agree we have a session?" — not a token check.
// We can't see the httpOnly cookie, so the only truthful signal is `user`,
// which is only set after a successful /login or /profile.
const isAuthenticated = () => !!getCachedUser();

export {
  signup,
  login,
  logout,
  getProfile,
  debugToken,
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
  getCachedUser,
  isAuthenticated,
  clearSession,
};