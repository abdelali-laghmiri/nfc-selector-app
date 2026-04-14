import { getStoredToken } from "@/lib/auth/storage";
import { getApiBaseUrl } from "@/lib/config/runtime";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export interface RequestOptions {
  body?: unknown;
  headers?: HeadersInit;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string | null;
  retries?: number;
  retryDelay?: number;
}

function isFormDataBody(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function toRequestBody(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (isFormDataBody(body)) return body;
  return JSON.stringify(body);
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.detail === "string" && record.detail.length > 0) {
      return record.detail;
    }
    if (typeof record.message === "string" && record.message.length > 0) {
      return record.message;
    }
  }
  return fallback;
}

async function parsePayload(response: Response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const rawText = await response.text();
    return rawText || null;
  }

  return response.json();
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const apiBaseUrl = await getApiBaseUrl();
  const headers = new Headers(options.headers);
  const token = options.token ?? getStoredToken();
  const bodyIsFormData = isFormDataBody(options.body);
  const requestBody = toRequestBody(options.body);
  const maxRetries = options.retries ?? 3;
  const retryDelay = options.retryDelay ?? 5000;

  if (
    options.body !== undefined &&
    !bodyIsFormData &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        method: options.method ?? (options.body ? "POST" : "GET"),
        headers,
        body: requestBody,
        cache: "no-store",
      });

      const payload = await parsePayload(response);

      if (!response.ok) {
        throw new ApiError(
          extractErrorMessage(payload, "The request could not be completed."),
          response.status,
          payload
        );
      }

      return payload as T;
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const isNetworkError =
          error instanceof TypeError && error.message.includes("fetch");

        if (isNetworkError) {
          console.log(`Network error, retrying (${attempt + 1}/${maxRetries})...`);
          await sleep(retryDelay * (attempt + 1));
        } else if (error instanceof ApiError) {
          const isAuthError = error.status === 401 || error.status === 403;
          if (isAuthError) {
            throw error;
          }
          console.log(`API error ${error.status}, retrying (${attempt + 1}/${maxRetries})...`);
          await sleep(retryDelay);
        }
      }
    }
  }

  throw lastError || new Error("Request failed after retries");
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">
  ) => apiRequest<T>(path, { ...options, body, method: "POST" }),
  put: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">
  ) => apiRequest<T>(path, { ...options, body, method: "PUT" }),
  delete: <T>(
    path: string,
    options?: Omit<RequestOptions, "method" | "body">
  ) => apiRequest<T>(path, { ...options, method: "DELETE" }),
};
