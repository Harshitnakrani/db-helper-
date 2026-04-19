import type { ChatMessage } from '../types'

interface MessageProps {
  message: ChatMessage
}

export function Message({ message }: MessageProps) {
  return (
    <div className={`message ${message.role}`}>
      <strong>{message.role === 'user' ? 'You' : 'AI'}:</strong> {message.content}
    </div>
  )
}
