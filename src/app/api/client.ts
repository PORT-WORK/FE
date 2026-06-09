import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const rawBaseURL = import.meta.env.VITE_API_BASE_URL?.trim();
const baseURL = rawBaseURL
  ? rawBaseURL.replace(/\/$/, '').endsWith('/api')
    ? rawBaseURL.replace(/\/$/, '')
    : `${rawBaseURL.replace(/\/$/, '')}/api`
  : 'http://localhost:8080/api';

const userId = String(import.meta.env.VITE_USER_ID || 1);

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-USER-ID': userId,
  },
});

function unwrap<T>(payload: T): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in (payload as Record<string, unknown>) &&
    'data' in (payload as Record<string, unknown>)
  ) {
    return (payload as { data: T }).data;
  }
  return payload;
}

export async function apiRequest<T>(config: AxiosRequestConfig, fallback: () => T | Promise<T>): Promise<T> {
  try {
    const { data } = await apiClient.request<T>(config);
    return unwrap(data);
  } catch (error) {
    const err = error as AxiosError;
    if (err.response || err.request) return fallback();
    throw error;
  }
}
