import type { ChatMessage } from '../types'
import { Message } from './Message'

interface ChatProps {
  messages: ChatMessage[]
}

export function Chat({ messages }: ChatProps) {
  if (!messages.length) {
    return <div className="chat-empty">Start by asking a question about your data.</div>
  }

  return (
    <div className="chat-list">
      {messages.map((message, index) => (
        <Message key={`${message.role}-${index}`} message={message} />
      ))}
    </div>
  )
}
