import { apiClient } from "@/lib/api/client";
import type { LoginRequest, LoginResponse, AuthUser } from "@/types/auth";
import {
  persistAuthSession,
  clearAuthSession,
  getStoredCredentials,
  type StoredCredentials,
} from "@/lib/auth/storage";

const TOKEN_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
const MAX_REFRESH_RETRIES = 3;
const REFRESH_RETRY_DELAY = 5000;

let refreshTimer: ReturnType<typeof setInterval> | null = null;
let refreshRetries = 0;

export interface AuthService {
  login: (credentials: StoredCredentials) => Promise<LoginResponse>;
  refreshToken: () => Promise<LoginResponse | null>;
  logout: () => void;
  startTokenRefresh: () => void;
  stopTokenRefresh: () => void;
  validateToken: () => Promise<boolean>;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function login(
  credentials: StoredCredentials
): Promise<LoginResponse> {
  const request: LoginRequest = {
    matricule: credentials.matricule,
    password: credentials.password,
  };

  const response = await apiClient.post<LoginResponse>("/auth/login", request);

  persistAuthSession(response.access_token, response.user, credentials);

  return response;
}

export async function refreshToken(): Promise<LoginResponse | null> {
  const credentials = getStoredCredentials();
  if (!credentials) {
    console.log("No stored credentials for refresh");
    return null;
  }

  try {
    const response = await login(credentials);
    refreshRetries = 0;
    return response;
  } catch (error) {
    refreshRetries++;
    console.error(`Token refresh failed (attempt ${refreshRetries}/${MAX_REFRESH_RETRIES})`);

    if (refreshRetries >= MAX_REFRESH_RETRIES) {
      console.error("Max refresh retries reached, clearing session");
      clearAuthSession();
      throw error;
    }

    await sleep(REFRESH_RETRY_DELAY);
    return refreshToken();
  }
}

export function logout(): void {
  clearAuthSession();
  stopTokenRefresh();
}

export function startTokenRefresh(onRefreshFailed?: () => void): void {
  stopTokenRefresh();

  refreshTimer = setInterval(async () => {
    try {
      await refreshToken();
    } catch (error) {
      console.error("Token refresh error:", error);
      if (onRefreshFailed) {
        onRefreshFailed();
      }
    }
  }, TOKEN_REFRESH_INTERVAL);
}

export function stopTokenRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

export async function validateToken(): Promise<boolean> {
  try {
    const response = await apiClient.get<AuthUser>("/auth/me");
    return !!response;
  } catch {
    return false;
  }
}
