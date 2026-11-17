// context/AuthContext.jsx
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import { getSocket, resetSocket } from '../services/socketService';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCachedUser());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null); // FIX: surfaced to login page

  // ── Bootstrap: if a cached user exists, validate via /profile ──
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      // FIX #6: no token check — just try /profile if we have a cached user
      // OR always try /profile so a cookie-only session can resume after a
      // hard refresh where localStorage was cleared (private mode, etc).
      try {
        const fresh = await authService.getProfile();
        if (!cancelled) {
          setUser(fresh);
          setAuthError(null);
        }
      } catch {
        // No session / expired — clear local cache
        authService.clearSession();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Session expiry from api.js interceptor ─────────────
  useEffect(() => {
    const onExpired = () => {
      authService.clearSession();
      resetSocket();
      setUser(null);
      toast.error('Your session expired. Please log in again.');
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  // ── Actions ────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const { user: loggedInUser } = await authService.login(credentials);
    setUser(loggedInUser);
    setAuthError(null);
    getSocket(); // initialise socket after auth (uses cookie)
    return loggedInUser;
  }, []);

  const signup = useCallback(async (payload) => {
    const result = await authService.signup(payload);
    // Signup does NOT log in — UI must redirect to /login
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    resetSocket();
    setUser(null);
    setAuthError(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const fresh = await authService.getProfile();
    setUser(fresh);
    return fresh;
  }, []);

  // FIX #6: single source of truth — the backend-validated user object
  const isAuthenticated = !!user;

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      isAuthenticated,
      login,
      signup,
      logout,
      refreshProfile,
    }),
    [user, loading, authError, isAuthenticated, login, signup, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}