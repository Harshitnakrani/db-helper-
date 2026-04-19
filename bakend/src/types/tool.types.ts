export type ToolName = 'get_schema' | 'get_data'

export interface DbConnectionConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
  ssl?: boolean
}

export interface GetSchemaArgs {
  table?: string
}

export interface GetDataArgs {
  query: string
}
