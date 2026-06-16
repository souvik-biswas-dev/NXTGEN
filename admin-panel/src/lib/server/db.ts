import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DATABASE_URL } from '$env/static/private';
import * as schema from './schema';

// The admin panel is a trusted server-side SvelteKit app, so it connects
// directly to the same Neon Postgres the API uses (same schema). This mirrors
// how the API's own service connects — it is "compatible with the same backend".
// Reuse a single pool across HMR reloads in dev.
const g = globalThis as unknown as { __adminPool?: pg.Pool };
const pool =
  g.__adminPool ??
  new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });
if (process.env.NODE_ENV !== 'production') g.__adminPool = pool;

export const db = drizzle(pool, { schema });
export { schema };
