import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

/** Throw this from any route/handler to return a clean JSON error. */
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (msg: string, code?: string) => new ApiError(400, msg, code);
export const unauthorized = (msg = 'Not authenticated') => new ApiError(401, msg);
export const forbidden = (msg = 'Not allowed') => new ApiError(403, msg);
export const notFound = (msg = 'Not found') => new ApiError(404, msg);
export const conflict = (msg: string) => new ApiError(409, msg);
export const tooMany = (msg = 'Rate limit exceeded') => new ApiError(429, msg, 'rate_limited');

/** Central error handler attached via app.onError. */
export function handleError(err: Error, c: Context) {
  if (err instanceof ApiError) {
    return c.json({ error: err.message, code: err.code }, err.status as 400);
  }
  if (err instanceof ZodError) {
    return c.json(
      { error: 'Validation failed', code: 'validation', issues: err.flatten() },
      400
    );
  }
  // Hono-thrown errors (e.g. bodyLimit 413, malformed routes) carry their own status.
  if (err instanceof HTTPException) {
    return c.json({ error: err.message || 'Request error' }, err.status);
  }
  console.error('[unhandled]', err);
  return c.json({ error: 'Internal server error' }, 500);
}
