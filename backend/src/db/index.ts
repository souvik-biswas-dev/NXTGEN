import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '@/config/env';
import * as schema from './schema';

// Long-lived pooled connection (the server is persistent on Railway/Render/Fly).
// Use the Neon *pooled* connection string (DATABASE_URL ending in -pooler).
const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

export const db = drizzle(pool, { schema });
export { schema };
export type DB = typeof db;
