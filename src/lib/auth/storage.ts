import type { AuthUser } from "@/types/auth";

const ACCESS_TOKEN_KEY = "nfc_selector.access_token";
const USER_KEY = "nfc_selector.user";
const CREDENTIALS_KEY = "nfc_selector.credentials";

export interface StoredCredentials {
  matricule: string;
  password: string;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function getStoredToken(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (!canUseStorage()) return null;
  
  const rawUser = window.localStorage.getItem(USER_KEY);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function getStoredCredentials(): StoredCredentials | null {
  if (!canUseStorage()) return null;
  
  const rawCreds = window.localStorage.getItem(CREDENTIALS_KEY);
  if (!rawCreds) return null;

  try {
    return JSON.parse(rawCreds) as StoredCredentials;
  } catch {
    window.localStorage.removeItem(CREDENTIALS_KEY);
    return null;
  }
}

export function persistAuthSession(
  accessToken: string,
  user: AuthUser,
  credentials?: StoredCredentials
) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  
  if (credentials) {
    window.localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  }
}

export function clearAuthSession() {
  if (!canUseStorage()) return;

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function hasStoredCredentials(): boolean {
  return !!getStoredCredentials();
}
