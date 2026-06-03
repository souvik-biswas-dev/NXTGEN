import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { normalizePropertyResponse } from './normalize';

// Base URL of the Hono backend. Set EXPO_PUBLIC_API_URL in .env.
// On a physical device, use your machine's LAN IP (not localhost).
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra?.apiUrl as string) ||
  'http://localhost:4000';

const ACCESS_KEY = 'ngp.accessToken';
const REFRESH_KEY = 'ngp.refreshToken';

// ── Token storage (SecureStore) ──────────────────────────────────
let accessTokenCache: string | null = null;
type Listener = (signedIn: boolean) => void;
const listeners = new Set<Listener>();

export function onAuthChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit(signedIn: boolean) {
  for (const l of listeners) l(signedIn);
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  accessTokenCache = accessToken;
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
  ]);
  emit(true);
}

export async function clearTokens(): Promise<void> {
  accessTokenCache = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
  emit(false);
}

export async function getAccessToken(): Promise<string | null> {
  if (accessTokenCache) return accessTokenCache;
  accessTokenCache = await SecureStore.getItemAsync(ACCESS_KEY);
  return accessTokenCache;
}

export async function hasSession(): Promise<boolean> {
  return Boolean(await getAccessToken());
}

// ── Error type ───────────────────────────────────────────────────
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// ── Refresh handling (single-flight) ─────────────────────────────
let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        await clearTokens();
        return false;
      }
      const data = (await res.json()) as { accessToken: string; refreshToken: string };
      await setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

// ── Core request ─────────────────────────────────────────────────
interface RequestOpts {
  method?: string;
  body?: unknown;
  auth?: boolean; // attach access token (default true)
  retry?: boolean; // internal: retry-after-refresh guard
}

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { method = 'GET', body, auth = true, retry = true } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Auto-refresh once on 401.
  if (res.status === 401 && auth && retry) {
    if (await tryRefresh()) return request<T>(path, { ...opts, retry: false });
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  // The backend sits behind Render, which serves an HTML error page when the
  // instance is cold or unavailable. Guard JSON.parse so those bodies surface as
  // a clean ApiError instead of an unhandled "Unexpected token <" SyntaxError.
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError(
        res.status,
        res.ok ? 'Unexpected response from server' : `Request failed (${res.status})`
      );
    }
  }
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`, data?.code);
  }
  // Property/favorite endpoints come back with raw camelCase Drizzle keys;
  // normalize them to the snake_case shape the app's types expect. Scoped by
  // path so we never touch camelCase JSON blobs (platform_data, auth tokens).
  if (data && PROPERTY_RESPONSE_PATH.test(path)) {
    data = normalizePropertyResponse(data);
  }
  return data as T;
}

// Endpoints whose payloads are property rows (or arrays of them).
const PROPERTY_RESPONSE_PATH = /^\/(properties(\/|\?|$)|favorites|recently-viewed|admin\/listings)/;

function qs(params?: Record<string, unknown>): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.append(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const api = {
  url: API_URL,
  get: <T>(path: string, params?: Record<string, unknown>, auth = true) =>
    request<T>(`${path}${qs(params)}`, { method: 'GET', auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: 'POST', body, auth }),
  patch: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: 'PATCH', body, auth }),
  put: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: 'PUT', body, auth }),
  del: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: 'DELETE', body, auth }),
};
