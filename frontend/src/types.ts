export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface DbConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
  ssl?: boolean
}
