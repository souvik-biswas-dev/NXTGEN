import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '@/config/env';
import * as schema from './schema';

// Long-lived pooled connection (the server is persistent on Railway/Render/Fly).
// Use the Neon *pooled* connection string (DATABASE_URL ending in -pooler).
//
// Verify the server certificate by default (Neon presents a publicly-trusted
// cert) so the DB link can't be MITM'd. Set DATABASE_SSL_NO_VERIFY=true only as
// an emergency escape hatch for an environment with an untrusted CA.
const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: { rejectUnauthorized: process.env.DATABASE_SSL_NO_VERIFY !== 'true' },
  max: 10,
});

export const db = drizzle(pool, { schema });
export { schema };
export type DB = typeof db;
