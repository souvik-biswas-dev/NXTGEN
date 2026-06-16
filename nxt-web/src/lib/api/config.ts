import { env } from '$env/dynamic/public';

/**
 * Base URL of the Hono backend (shared with the Expo app & admin panel).
 * Override with PUBLIC_API_URL in `.env`. Defaults to local dev.
 */
export const API_URL = env.PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000';

/** WebSocket URL derived from the API URL (realtime chat). */
export const WS_URL = API_URL.replace(/^http/, 'ws') + '/ws';

export const TOKEN_KEYS = {
	access: 'ngp.accessToken',
	refresh: 'ngp.refreshToken'
} as const;
