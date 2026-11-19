import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg'

// Global connection pool to avoid creating new pools on HMR in development
const globalForDb = globalThis as unknown as {
  __elms_pg_pool?: Pool
}

const connectionString =
  process.env.DATABASE_URL || 'postgresql://ananda@localhost:5432/elms360'

export const pool =
  globalForDb.__elms_pg_pool ||
  new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__elms_pg_pool = pool
}

/**
 * Execute a single query on the pool
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  try {
    const res = await pool.query<T>(text, params)
    const duration = Date.now() - start
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.log('[PG_SLOW_QUERY]', { text: text.slice(0, 100), duration, rows: res.rowCount })
    }
    return res
  } catch (error: any) {
    console.error('[PG_QUERY_ERROR]', { text, error: error.message })
    throw error
  }
}

/**
 * Run a multi-statement transaction safely
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}
