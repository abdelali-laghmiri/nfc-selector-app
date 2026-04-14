const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://backend-n-lac.vercel.app";

export const API_BASE_URL = `${BACKEND_URL}/api/v1`;

export function getApiBaseUrl() {
  return API_BASE_URL;
}
