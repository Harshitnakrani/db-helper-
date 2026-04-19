import { Router } from 'express'
import { runAgent } from '../services/agent.service.js'
import type { DbConnectionConfig } from '../types/tool.types.js'

export const chatRouter = Router()

chatRouter.post('/', async (req, res) => {
  const message = req.body?.message
  const dbConfig = req.body?.dbConfig as Partial<DbConnectionConfig> | undefined
  const history = req.body?.history as Array<{ role: 'user' | 'assistant'; content: string }> | undefined

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' })
  }
  if (!dbConfig) {
    return res.status(400).json({ error: 'dbConfig is required' })
  }

  try {
    const normalizedDbConfig: DbConnectionConfig = {
      host: String(dbConfig.host ?? ''),
      port: Number(dbConfig.port ?? 5432),
      user: String(dbConfig.user ?? ''),
      password: String(dbConfig.password ?? ''),
      database: String(dbConfig.database ?? ''),
      ssl: Boolean(dbConfig.ssl ?? false)
    }

    const reply = await runAgent(message, normalizedDbConfig, history || [])
    return res.json({ reply })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to process chat request' })
  }
})
