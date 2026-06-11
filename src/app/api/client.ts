import axios, { AxiosRequestConfig } from 'axios';

const rawBaseURL = import.meta.env.VITE_API_BASE_URL?.trim();
const baseURL = rawBaseURL
  ? rawBaseURL.replace(/\/$/, '').endsWith('/api')
    ? rawBaseURL.replace(/\/$/, '')
    : `${rawBaseURL.replace(/\/$/, '')}/api`
  : 'http://localhost:8080/api';

const userId = String(import.meta.env.VITE_USER_ID || 1);
const backendOrigin = baseURL.replace(/\/api$/, '');

export const currentUserId = Number(userId);

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-USER-ID': userId,
  },
});

export function buildOauthLoginUrl(provider: 'kakao' | 'google') {
  return `${backendOrigin}/oauth2/authorization/${provider}`;
}

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
    throw error;
  }
}

export async function apiRequestStrict<T>(config: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.request<T>(config);
  return unwrap(data);
}

type RealtimeEventHandler = (event: { type: string; data: unknown }) => void;

function parseRealtimePayload(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function subscribeRealtime(handler: RealtimeEventHandler) {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => undefined;
  }

  const url = `${backendOrigin}/realtime/stream?userId=${currentUserId}`;
  const source = new EventSource(url, { withCredentials: true });

  const bind = (type: string) => (event: MessageEvent<string>) => {
    handler({ type, data: parseRealtimePayload(event.data) });
  };

  source.addEventListener('connected', bind('connected'));
  source.addEventListener('message', bind('message'));
  source.addEventListener('notification', bind('notification'));
  source.addEventListener('heartbeat', bind('heartbeat'));

  return () => {
    source.close();
  };
}
