import type { DbConfig, ChatMessage } from '../types'

export async function sendChatMessage(
  message: string,
  dbConfig: DbConfig,
  history: ChatMessage[] = []
): Promise<string> {
  const baseUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'
  const response = await fetch(`${baseUrl}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, dbConfig, history })
  })

  if (!response.ok) {
    throw new Error('Failed to get response from server')
  }

  const data = (await response.json()) as { reply?: string }
  return data.reply ?? 'No reply received.'
}
