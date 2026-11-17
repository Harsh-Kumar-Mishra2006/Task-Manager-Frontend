// context/AuthContext.jsx
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import { getSocket, resetSocket } from '../services/socketService';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCachedUser());
  const [loading, setLoading] = useState(true); // true during initial profile fetch

  // ── Bootstrap: if a token exists, refresh the profile ──
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!authService.isAuthenticated()) {
        setLoading(false);
        return;
      }
      try {
        const fresh = await authService.getProfile();
        if (!cancelled) setUser(fresh);
      } catch {
        // Token invalid / expired — clear it
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

  // ── Handle session expiry from api.js interceptor ────────
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

  // ── Actions ──────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const { user: loggedInUser } = await authService.login(credentials);
    setUser(loggedInUser);
    getSocket(); // initialise socket after auth
    return loggedInUser;
  }, []);

  const signup = useCallback(async (payload) => {
    const result = await authService.signup(payload);
    // Signup does NOT log in — user must log in after
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    resetSocket();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const fresh = await authService.getProfile();
    setUser(fresh);
    return fresh;
  }, []);

  // ── Derived flags ────────────────────────────────────────
  const isAuthenticated = !!user && authService.isAuthenticated();

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      login,
      signup,
      logout,
      refreshProfile,
    }),
    [user, loading, isAuthenticated, login, signup, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}