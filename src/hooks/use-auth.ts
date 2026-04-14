import { useState, useEffect, useCallback } from "react";
import type { AuthState } from "@/types/auth";
import {
  getStoredToken,
  getStoredUser,
  hasStoredCredentials,
  clearAuthSession,
  type StoredCredentials,
} from "@/lib/auth/storage";
import { login, logout, startTokenRefresh, stopTokenRefresh, refreshToken, validateToken } from "@/lib/auth/service";

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  accessToken: null,
  tokenExpiresAt: null,
  error: null,
};

export function useAuth() {
  const [state, setState] = useState<AuthState>(initialState);

  const handleLogin = useCallback(async (credentials: StoredCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await login(credentials);
      startTokenRefresh(() => {
        setState((prev) => ({
          ...prev,
          isAuthenticated: false,
          error: "Session expired. Please login again.",
        }));
      });

      setState({
        isAuthenticated: true,
        isLoading: false,
        user: response.user,
        accessToken: response.access_token,
        tokenExpiresAt: Date.now() + response.expires_in * 1000,
        error: null,
      });

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setState(initialState);
  }, []);

  const handleRefreshToken = useCallback(async () => {
    try {
      const response = await refreshToken();
      if (response) {
        setState((prev) => ({
          ...prev,
          accessToken: response.access_token,
          tokenExpiresAt: Date.now() + response.expires_in * 1000,
          user: response.user,
        }));
      }
    } catch (error) {
      handleLogout();
    }
  }, [handleLogout]);

  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      const user = getStoredUser();
      const hasCreds = hasStoredCredentials();

      if (token && user && hasCreds) {
        const isValid = await validateToken();
        if (isValid) {
          startTokenRefresh(() => {
            setState((prev) => ({
              ...prev,
              isAuthenticated: false,
              error: "Session expired. Please login again.",
            }));
          });

          setState({
            isAuthenticated: true,
            isLoading: false,
            user,
            accessToken: token,
            tokenExpiresAt: Date.now() + 3600 * 1000,
            error: null,
          });
          return;
        }
      }

      clearAuthSession();
      setState({ ...initialState, isLoading: false });
    };

    initAuth();

    return () => {
      stopTokenRefresh();
    };
  }, []);

  return {
    ...state,
    login: handleLogin,
    logout: handleLogout,
    refreshToken: handleRefreshToken,
  };
}
