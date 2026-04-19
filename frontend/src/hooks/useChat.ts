import { useState } from 'react'
import { sendChatMessage } from '../api/chat'
import type { ChatMessage, DbConfig } from '../types'

function sanitizeAssistantReply(reply: string): string {
  const leakRegexes = [/get_schema/i, /get_data/i, /<function=/i, /"tool"\s*:/i, /"arguments"\s*:/i]
  if (!leakRegexes.some((regex) => regex.test(reply))) {
    return reply
  }

  const cleaned = reply
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !leakRegexes.some((regex) => regex.test(line)))
    .join('\n')
    .trim()

  return cleaned || 'I found the data, but the response format was noisy. Please ask once more.'
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  const sendMessage = async (input: string, dbConfig: DbConfig) => {
    const content = input.trim()
    if (!content || loading) {
      return
    }

    const currentHistory = [...messages]
    setMessages((prev) => [...prev, { role: 'user', content }])
    setLoading(true)

    try {
      const reply = await sendChatMessage(content, dbConfig, currentHistory)
      setMessages((prev) => [...prev, { role: 'assistant', content: sanitizeAssistantReply(reply) }])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error'
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${message}` }])
    } finally {
      setLoading(false)
    }
  }

  return { messages, loading, sendMessage }
}
