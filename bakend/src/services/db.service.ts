import { createDbPool } from '../config/db.config.js'
import type { DbConnectionConfig } from '../types/tool.types.js'
import { ensureSafeSelectQuery } from '../utils/sqlValidator.js'

export async function runSafeSelectQuery(
  query: string,
  dbConfig: DbConnectionConfig
): Promise<unknown[]> {
  const dbPool = createDbPool(dbConfig)
  const safeQuery = ensureSafeSelectQuery(query)
  try {
    const result = await dbPool.query(safeQuery)
    return result.rows
  } finally {
    await dbPool.end()
  }
}
