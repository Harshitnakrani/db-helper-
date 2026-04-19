import { getDataTool } from '../tools/getData.js'
import { getSchemaTool } from '../tools/getSchema.js'
import type { DbConnectionConfig } from '../types/tool.types.js'
import { formatRowsForModel } from '../utils/formatter.js'
import { groq, loadSystemPrompt, TOOL_DEFINITIONS } from './llm.service.js'

type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
}

const MAX_AGENT_STEPS = 10
const MAX_HISTORY_MESSAGES = 18
const MAX_TOOL_CONTENT_CHARS = 8000
const TOOL_MEMORY_PREVIEW_CHARS = 500

function safeParseArgs(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function parseManualToolCall(content: string): { name: string; args: Record<string, unknown> } | null {
  const trimmed = content.trim()

  try {
    const parsed = JSON.parse(trimmed) as { tool?: string; arguments?: Record<string, unknown> }
    if (parsed.tool && typeof parsed.tool === 'string') {
      return { name: parsed.tool, args: parsed.arguments ?? {} }
    }
  } catch {
    // fall through to function-tag parsing
  }

  const fnMatch = trimmed.match(/^<function=([a-z_]+)\(([\s\S]*)\)><\/function>$/i)
  if (fnMatch) {
    const name = fnMatch[1]
    const argsRaw = fnMatch[2]
    if (!name || argsRaw === undefined) {
      return null
    }
    return { name, args: safeParseArgs(argsRaw) }
  }

  // Also handle malformed variants like:
  // <function=get_data{"query":"SELECT ..."}></function>
  const fnJsonMatch = trimmed.match(/^<function=([a-z_]+)(\{[\s\S]*\})><\/function>$/i)
  if (fnJsonMatch) {
    const name = fnJsonMatch[1]
    const argsRaw = fnJsonMatch[2]
    if (!name || argsRaw === undefined) {
      return null
    }
    return { name, args: safeParseArgs(argsRaw) }
  }

  return null
}

function compactMessages(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_HISTORY_MESSAGES) {
    return messages
  }

  const system = messages[0]
  const dropped = messages.slice(1, -(MAX_HISTORY_MESSAGES - 1))
  const tail = messages.slice(-(MAX_HISTORY_MESSAGES - 1))

  const toolMemory = dropped
    .filter((m) => m.role === 'tool' && m.content)
    .slice(-3)
    .map((m, idx) => `tool_result_${idx + 1}: ${m.content.slice(0, TOOL_MEMORY_PREVIEW_CHARS)}`)
    .join('\n')

  const assistantMemory = dropped
    .filter((m) => m.role === 'assistant' && m.content)
    .slice(-2)
    .map((m, idx) => `assistant_${idx + 1}: ${m.content.slice(0, 220)}`)
    .join('\n')

  const memorySummary = (toolMemory || assistantMemory)
    ? {
        role: 'system' as const,
        content: `Memory summary from earlier trimmed context:\n${toolMemory}\n${assistantMemory}\nUse this only as supporting context; prioritize latest tool results.`
      }
    : null

  const compacted = [system, memorySummary, ...tail].filter(Boolean) as ChatMessage[]
  return compacted
}

function safeToolContent(payload: object): string {
  const raw = JSON.stringify(payload)
  if (raw.length <= MAX_TOOL_CONTENT_CHARS) {
    return raw
  }
  return JSON.stringify({
    truncated: true,
    note: `Tool result exceeded ${MAX_TOOL_CONTENT_CHARS} chars`,
    preview: raw.slice(0, MAX_TOOL_CONTENT_CHARS)
  })
}

function hasLeakage(text: string): boolean {
  const leakagePatterns = [
    /get_schema/i,
    /get_data/i,
    /<function=/i,
    /"tool"\s*:/i,
    /"arguments"\s*:/i,
    /\bi need to call\b/i,
    /\bfirst,?\s*i need\b/i,
    /\bto answer this\b/i
  ]
  return leakagePatterns.some((pattern) => pattern.test(text))
}

function needsAnotherLoop(text: string): boolean {
  const loopPatterns = [
    /\bi need to\b/i,
    /\bi will\b/i,
    /\blet me\b/i,
    /\bto find\b/i,
    /\bi should\b/i,
    /\bfirst\b/i,
    /\bthen\b/i,
    /\bprocess\b/i,
    /\bcall the\b/i
  ]
  return loopPatterns.some((pattern) => pattern.test(text))
}

function stripLeakyLines(text: string): string {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !hasLeakage(line))
  return lines.join('\n').trim()
}

async function polishFinalAnswer(userQuestion: string, rawAnswer: string): Promise<string> {
  const cleaned = stripLeakyLines(rawAnswer)
  if (cleaned && !hasLeakage(cleaned)) {
    return cleaned
  }

  const rewrite = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'Rewrite the draft into a concise final user answer only. Do not mention tools, schema calls, steps, or internal reasoning.'
      },
      {
        role: 'user',
        content: `User question: ${userQuestion}\nDraft answer: ${rawAnswer}`
      }
    ] as never
  })

  return rewrite.choices[0]?.message?.content?.trim() || 'I could not generate a clean final answer.'
}

async function executeToolCall(
  fnName: string,
  args: Record<string, unknown>,
  dbConfig: DbConnectionConfig
): Promise<object> {
  if (fnName === 'get_schema') {
    const table = args.table as string | undefined
    return getSchemaTool(table ? { table } : {}, dbConfig)
  }
  if (fnName === 'get_data') {
    return getDataTool({ query: String(args.query ?? '') }, dbConfig)
  }
  return { error: `Unknown tool ${fnName}` }
}

export async function runAgent(
  userMessage: string,
  dbConfig: DbConnectionConfig,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  const systemPrompt = await loadSystemPrompt()
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({ role: m.role, content: m.content }) as ChatMessage),
    { role: 'user', content: userMessage }
  ]

  for (let i = 0; i < MAX_AGENT_STEPS; i += 1) {
    let completion
    try {
      completion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
        messages: compactMessages(messages) as never,
        tools: TOOL_DEFINITIONS,
        tool_choice: 'auto'
      })
    } catch (error) {
      const maybeError = error as {
        error?: {
          error?: {
            code?: string
            failed_generation?: string
          }
        }
      }

      const code = maybeError.error?.error?.code
      const failedGeneration = maybeError.error?.error?.failed_generation
      const manualToolCall = failedGeneration ? parseManualToolCall(failedGeneration) : null

      if (code === 'tool_use_failed' && manualToolCall) {
        const toolResult = await executeToolCall(manualToolCall.name, manualToolCall.args, dbConfig)
        const normalizedResult =
          manualToolCall.name === 'get_data' && Array.isArray((toolResult as { rows?: unknown[] }).rows)
            ? { rows: formatRowsForModel((toolResult as { rows: unknown[] }).rows) }
            : toolResult

        messages.push({
          role: 'system',
          content: `Recovered Groq failed_generation tool call for ${manualToolCall.name}. Tool result: ${safeToolContent(
            normalizedResult
          )}. Continue and provide final answer only.`
        })
        continue
      }

      throw error
    }

    const message = completion.choices[0]?.message
    if (!message) {
      return 'I could not generate a response.'
    }

    const toolCalls = message.tool_calls ?? []
    const assistantContent = message.content ?? ''

    if (toolCalls.length) {
      // Keep only minimal assistant placeholder during tool phase.
      messages.push({ role: 'assistant', content: '' })
    } else {
      messages.push({ role: 'assistant', content: assistantContent })
    }

    if (!toolCalls.length) {
      const manualToolCall = message.content ? parseManualToolCall(message.content) : null
      if (manualToolCall) {
        const toolResult = await executeToolCall(manualToolCall.name, manualToolCall.args, dbConfig)
        const normalizedResult =
          manualToolCall.name === 'get_data' && Array.isArray((toolResult as { rows?: unknown[] }).rows)
            ? { rows: formatRowsForModel((toolResult as { rows: unknown[] }).rows) }
            : toolResult

        messages.push({
          role: 'system',
          content: `Recovered manual tool output for ${manualToolCall.name}. Tool result: ${safeToolContent(
            normalizedResult
          )}. Continue the same request and provide the final user-facing answer.`
        })
        continue
      }
      const polished = await polishFinalAnswer(userMessage, assistantContent || 'I could not generate a response.')

      if ((hasLeakage(polished) || needsAnotherLoop(polished)) && i < MAX_AGENT_STEPS - 1) {
        messages.push({
          role: 'system',
          content:
            'The previous assistant text was not a final user-facing answer. Continue reasoning, call tools if needed, and return only the final direct answer.'
        })
        continue
      }

      return polished
    }

    for (const call of toolCalls) {
      const fnName = call.function.name
      const args = safeParseArgs(call.function.arguments)
      const toolResult = await executeToolCall(fnName, args, dbConfig)

      const normalizedResult =
        fnName === 'get_data' && Array.isArray((toolResult as { rows?: unknown[] }).rows)
          ? { rows: formatRowsForModel((toolResult as { rows: unknown[] }).rows) }
          : toolResult

      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: safeToolContent(normalizedResult)
      })
    }
  }

  return 'I could not complete the request in time. Please rephrase and try again.'
}
