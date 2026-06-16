import { browser } from '$app/environment';
import { API_URL, TOKEN_KEYS } from './config';

/* ── Token storage (localStorage, browser-only) ──────────────────── */
let accessCache: string | null = null;

export function getAccessToken(): string | null {
	if (!browser) return null;
	if (accessCache) return accessCache;
	accessCache = localStorage.getItem(TOKEN_KEYS.access);
	return accessCache;
}

function getRefreshToken(): string | null {
	if (!browser) return null;
	return localStorage.getItem(TOKEN_KEYS.refresh);
}

export function setTokens(accessToken: string, refreshToken: string) {
	if (!browser) return;
	accessCache = accessToken;
	localStorage.setItem(TOKEN_KEYS.access, accessToken);
	localStorage.setItem(TOKEN_KEYS.refresh, refreshToken);
}

export function clearTokens() {
	if (!browser) return;
	accessCache = null;
	localStorage.removeItem(TOKEN_KEYS.access);
	localStorage.removeItem(TOKEN_KEYS.refresh);
}

export function hasSession(): boolean {
	return Boolean(getAccessToken());
}

/* ── Error type ──────────────────────────────────────────────────── */
export class ApiError extends Error {
	status: number;
	code?: string;
	constructor(status: number, message: string, code?: string) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.code = code;
	}
}

/* ── Single-flight refresh ───────────────────────────────────────── */
let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
	if (refreshing) return refreshing;
	refreshing = (async () => {
		const refreshToken = getRefreshToken();
		if (!refreshToken) return false;
		try {
			const res = await fetch(`${API_URL}/auth/refresh`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refreshToken })
			});
			if (!res.ok) {
				clearTokens();
				return false;
			}
			const data = (await res.json()) as { accessToken: string; refreshToken: string };
			setTokens(data.accessToken, data.refreshToken);
			return true;
		} catch {
			return false;
		} finally {
			refreshing = null;
		}
	})();
	return refreshing;
}

/* ── Core request ────────────────────────────────────────────────── */
interface RequestOpts {
	method?: string;
	body?: unknown;
	auth?: boolean;
	retry?: boolean;
	/** SvelteKit's `fetch` for SSR load functions. */
	fetcher?: typeof fetch;
	signal?: AbortSignal;
}

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
	const { method = 'GET', body, auth = false, retry = true, fetcher = fetch, signal } = opts;
	const headers: Record<string, string> = {};
	if (body !== undefined) headers['Content-Type'] = 'application/json';
	if (auth) {
		const token = getAccessToken();
		if (token) headers.Authorization = `Bearer ${token}`;
	}

	let res: Response;
	try {
		res = await fetcher(`${API_URL}${path}`, {
			method,
			headers,
			body: body !== undefined ? JSON.stringify(body) : undefined,
			signal
		});
	} catch (err) {
		if ((err as Error)?.name === 'AbortError') throw err;
		throw new ApiError(0, 'Network error — is the backend running?', 'network');
	}

	if (res.status === 401 && auth && retry) {
		if (await tryRefresh()) return request<T>(path, { ...opts, retry: false });
	}

	if (res.status === 204) return undefined as T;

	const text = await res.text();
	const data = text ? JSON.parse(text) : null;
	if (!res.ok) {
		throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`, data?.code);
	}
	return data as T;
}

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
	get: <T>(
		path: string,
		params?: Record<string, unknown>,
		opts: Omit<RequestOpts, 'method' | 'body'> = {}
	) => request<T>(`${path}${qs(params)}`, { ...opts, method: 'GET' }),
	post: <T>(path: string, body?: unknown, opts: Omit<RequestOpts, 'method'> = {}) =>
		request<T>(path, { ...opts, method: 'POST', body }),
	patch: <T>(path: string, body?: unknown, opts: Omit<RequestOpts, 'method'> = {}) =>
		request<T>(path, { ...opts, method: 'PATCH', body }),
	put: <T>(path: string, body?: unknown, opts: Omit<RequestOpts, 'method'> = {}) =>
		request<T>(path, { ...opts, method: 'PUT', body }),
	del: <T>(path: string, body?: unknown, opts: Omit<RequestOpts, 'method'> = {}) =>
		request<T>(path, { ...opts, method: 'DELETE', body })
};
