import { createDbPool } from '../config/db.config.js'
import type { DbConnectionConfig } from '../types/tool.types.js'

export async function getAllTables(dbConfig: DbConnectionConfig): Promise<string[]> {
  const dbPool = createDbPool(dbConfig)
  try {
    const result = await dbPool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
    )
    return result.rows.map((row) => String(row.table_name))
  } finally {
    await dbPool.end()
  }
}

export async function getTableColumns(
  table: string,
  dbConfig: DbConnectionConfig
): Promise<Array<{ name: string; type: string }>> {
  const dbPool = createDbPool(dbConfig)
  try {
    const result = await dbPool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1
       ORDER BY ordinal_position;`,
      [table]
    )

    return result.rows.map((row) => ({
      name: String(row.column_name),
      type: String(row.data_type)
    }))
  } finally {
    await dbPool.end()
  }
}
