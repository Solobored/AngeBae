/**
 * PostgreSQL Client Utility
 * Provides a simple interface for database operations
 * Replaces Supabase with direct PostgreSQL connection
 */

import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null = null;

/**
 * Get or create the database connection pool
 */
export function getPool(): pg.Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString: databaseUrl,
      max: 20, // Maximum connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

/**
 * Execute a query and return results
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const res = await client.query(text, params);
    return res.rows;
  } finally {
    client.release();
  }
}

/**
 * Execute a single row query
 */
export async function querySingle<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const results = await query<T>(text, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute insert query and return inserted row
 */
export async function insert<T = any>(
  table: string,
  data: Record<string, any>
): Promise<T | null> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.join(', ');

  const text = `
    INSERT INTO ${table} (${columns})
    VALUES (${placeholders})
    RETURNING *
  `;

  return querySingle<T>(text, values);
}

/**
 * Execute update query and return updated rows
 */
export async function update<T = any>(
  table: string,
  data: Record<string, any>,
  where: Record<string, any>
): Promise<T[]> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);

  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const whereClause = whereKeys
    .map((key, i) => `${key} = $${keys.length + i + 1}`)
    .join(' AND ');

  const text = `
    UPDATE ${table}
    SET ${setClause}
    WHERE ${whereClause}
    RETURNING *
  `;

  return query<T>(text, [...values, ...whereValues]);
}

/**
 * Delete rows from table
 */
export async function deleteRows(
  table: string,
  where: Record<string, any>
): Promise<number> {
  const keys = Object.keys(where);
  const values = Object.values(where);

  const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');

  const text = `DELETE FROM ${table} WHERE ${whereClause}`;

  const client = await getPool().connect();
  try {
    const res = await client.query(text, values);
    return res.rowCount || 0;
  } finally {
    client.release();
  }
}

/**
 * Health check: verify database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1');
    return result.length > 0;
  } catch (err) {
    console.error('Database health check failed:', err);
    return false;
  }
}

/**
 * Close pool (for cleanup)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
