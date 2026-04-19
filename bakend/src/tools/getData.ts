import type { DbConnectionConfig, GetDataArgs } from '../types/tool.types.js'
import { runSafeSelectQuery } from '../services/db.service.js'

export async function getDataTool(args: GetDataArgs, dbConfig: DbConnectionConfig): Promise<object> {
  const rows = await runSafeSelectQuery(args.query, dbConfig)
  return { rows }
}
