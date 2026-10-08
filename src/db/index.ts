import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema.ts'

export const isDbConfigured = Boolean(
  process.env.SQL_HOST && process.env.SQL_DB_NAME
)

let lastConnectionFailureTime = 0
const FAILURE_COOLDOWN_MS = 30000 // 30 seconds cooldown after connection failure

export function markDbUnreachable() {
  lastConnectionFailureTime = Date.now()
}

export function markDbReachable() {
  lastConnectionFailureTime = 0
}

export function isDbAvailable(): boolean {
  if (!isDbConfigured) return false
  if (Date.now() - lastConnectionFailureTime < FAILURE_COOLDOWN_MS) {
    return false
  }
  return true
}

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined
}

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST || '127.0.0.1',
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 2000,
    })

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', () => {
      // Idle client disconnected or connection refused
    })
  }
  return global._postgresPool
}

// Create or retrieve the pool instance.
const pool = createPool()

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema })
export { schema }
