import { Pool } from 'pg'
import type { DbConnectionConfig } from '../types/tool.types.js'

function validateConfig(config: DbConnectionConfig): void {
  const missing = Object.entries(config)
    .filter(([, value]) => value === undefined || value === null || value === '')
    .map(([key]) => key)
  if (missing.length > 0) {
    throw new Error(`Missing dbConfig fields: ${missing.join(', ')}`)
  }
}

export function createDbPool(config: DbConnectionConfig): Pool {
  validateConfig(config)
  return new Pool({
    host: config.host,
    port: Number(config.port),
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined
  })
}
