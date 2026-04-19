import type { DbConnectionConfig, GetSchemaArgs } from '../types/tool.types.js'
import { getAllTables, getTableColumns } from '../services/schema.service.js'

export async function getSchemaTool(
  args: GetSchemaArgs,
  dbConfig: DbConnectionConfig
): Promise<object> {
  if (args.table) {
    const columns = await getTableColumns(args.table, dbConfig)
    return { table: args.table, columns }
  }

  const tables = await getAllTables(dbConfig)
  return { tables }
}
