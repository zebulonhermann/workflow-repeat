import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { attachDatabasePool } from '@vercel/functions';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
});

attachDatabasePool(pool);

export const db = drizzle(pool);
