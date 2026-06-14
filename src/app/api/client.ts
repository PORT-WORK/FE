import axios, { AxiosRequestConfig } from 'axios';

const rawBaseURL = import.meta.env.VITE_API_BASE_URL?.trim();
const baseURL = rawBaseURL
  ? rawBaseURL.replace(/\/$/, '').endsWith('/api')
    ? rawBaseURL.replace(/\/$/, '')
    : `${rawBaseURL.replace(/\/$/, '')}/api`
  : 'http://localhost:8080/api';

const defaultUserId = Number(import.meta.env.VITE_USER_ID || 1);
const backendOrigin = baseURL.replace(/\/api$/, '');
const ACCESS_TOKEN_KEY = 'port-access-token';
const REFRESH_TOKEN_KEY = 'port-refresh-token';

let currentUserIdOverride: number | null = null;

function safeWindow() {
  return typeof window === 'undefined' ? null : window;
}

export const API_URL = backendOrigin;

export function getAccessToken() {
  const win = safeWindow();
  if (!win) return '';
  return win.localStorage.getItem(ACCESS_TOKEN_KEY) || '';
}

export function getRefreshToken() {
  const win = safeWindow();
  if (!win) return '';
  return win.localStorage.getItem(REFRESH_TOKEN_KEY) || '';
}

export function setAccessToken(token: string) {
  const win = safeWindow();
  if (!win) return;
  if (token) {
    win.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    win.localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

export function setRefreshToken(token: string) {
  const win = safeWindow();
  if (!win) return;
  if (token) {
    win.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    win.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function clearAuthTokens() {
  const win = safeWindow();
  if (!win) return;
  win.localStorage.removeItem(ACCESS_TOKEN_KEY);
  win.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function decodeJwtPayload(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getCurrentUserId() {
  if (currentUserIdOverride && currentUserIdOverride > 0) {
    return currentUserIdOverride;
  }
  const token = getAccessToken();
  if (token) {
    const payload = decodeJwtPayload(token);
    const userId = Number(payload?.userId ?? payload?.sub ?? payload?.uid ?? 0);
    if (Number.isFinite(userId) && userId > 0) {
      return userId;
    }
  }
  return defaultUserId;
}

export function setCurrentUserId(nextUserId: number) {
  if (Number.isFinite(nextUserId) && nextUserId > 0) {
    currentUserIdOverride = nextUserId;
  }
}

export function resetCurrentUserId() {
  currentUserIdOverride = null;
}

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: false,
});

apiClient.interceptors.request.use(config => {
  const headers = { ...((config.headers ?? {}) as Record<string, string>) };
  headers.Accept = headers.Accept ?? 'application/json';
  headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  const accessToken = getAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else {
    delete headers.Authorization;
  }
  delete headers['X-USER-ID'];
  config.headers = headers;
  return config;
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

type FetchEventSourceOptions = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  onopen?: (response: Response) => void | Promise<void>;
  onmessage?: (event: { event: string; data: string }) => void;
  onerror?: (error: unknown) => void;
  onclose?: () => void;
};

export function fetchEventSource(url: string, options: FetchEventSourceOptions = {}) {
  const controller = new AbortController();
  const onopen = options.onopen;
  const onmessage = options.onmessage;
  const onerror = options.onerror;
  const onclose = options.onclose;
  const signal = options.signal;

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  const run = async () => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: options.headers,
        credentials: 'include',
        signal: controller.signal,
      });
      if (onopen) {
        await onopen(response);
      }
      if (!response.ok || !response.body) {
        throw new Error(`SSE request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let eventName = 'message';
      let dataLines: string[] = [];

      const flush = () => {
        if (dataLines.length > 0 && onmessage) {
          onmessage({ event: eventName, data: dataLines.join('\n') });
        }
        eventName = 'message';
        dataLines = [];
      };

      while (!controller.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let index = buffer.indexOf('\n');
        while (index >= 0) {
          let line = buffer.slice(0, index);
          buffer = buffer.slice(index + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line) {
            flush();
          } else if (!line.startsWith(':')) {
            const separator = line.indexOf(':');
            const field = separator >= 0 ? line.slice(0, separator) : line;
            let raw = separator >= 0 ? line.slice(separator + 1) : '';
            if (raw.startsWith(' ')) raw = raw.slice(1);
            if (field === 'event') {
              eventName = raw || 'message';
            } else if (field === 'data') {
              dataLines.push(raw);
            }
          }
          index = buffer.indexOf('\n');
        }
      }
      flush();
      if (onclose) {
        onclose();
      }
    } catch (error) {
      if (!controller.signal.aborted && onerror) {
        onerror(error);
      }
    }
  };

  void run();

  return {
    close() {
      controller.abort();
    },
  };
}

export function subscribeRealtime(handler: RealtimeEventHandler) {
  const accessToken = getAccessToken();
  if (typeof window === 'undefined' || !accessToken) {
    return () => undefined;
  }

  const stream = fetchEventSource(`${API_URL}/api/realtime/stream`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'text/event-stream',
    },
    onmessage: event => {
      handler({ type: event.event, data: parseRealtimePayload(event.data) });
    },
  });

  return () => {
    stream.close();
  };
}
