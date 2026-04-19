import fs from 'node:fs/promises'
import path from 'node:path'
import Groq from 'groq-sdk'
import dotenv from 'dotenv'
dotenv.config()
const groqApiKey = process.env.GROQ_API_KEY

if (!groqApiKey) {
  console.warn('GROQ_API_KEY is missing. /chat will fail until it is set.')
}

export const groq = new Groq({
  apiKey: groqApiKey
})

export const TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'get_schema',
      description: 'Fetch list of tables or columns for a specific table',
      parameters: {
        type: 'object',
        properties: {
          table: {
            type: 'string',
            description: 'Optional table name to get columns for'
          }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_data',
      description: 'Execute a read-only SQL SELECT query',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'SQL SELECT query'
          }
        },
        required: ['query']
      }
    }
  }
]

const fallbackPrompt = `You are an intelligent database assistant. Use tools get_schema and get_data.`

export async function loadSystemPrompt(): Promise<string> {
  try {
    const promptPath = path.resolve(process.cwd(), '..', 'prompt.md')
    const rawPrompt = await fs.readFile(promptPath, 'utf-8')
    return `${rawPrompt}

CRITICAL:
- Use native tool calls only.
- Never emit literal tool-call markup like <function=...>.
- Never emit manual JSON wrappers for tool calls.`
  } catch {
    return fallbackPrompt
  }
}
