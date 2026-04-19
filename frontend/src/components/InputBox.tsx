import { useState } from 'react'
import type { FormEvent } from 'react'
import type { DbConfig } from '../types'

interface InputBoxProps {
  loading: boolean
  dbConfig: DbConfig
  onSend: (message: string, dbConfig: DbConfig) => Promise<void>
}

export function InputBox({ loading, dbConfig, onSend }: InputBoxProps) {
  const [message, setMessage] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const value = message.trim()
    if (!value) {
      return
    }
    setMessage('')
    await onSend(value, dbConfig)
  }

  return (
    <form className="input-box" onSubmit={submit}>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask about your database..."
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Thinking...' : 'Send'}
      </button>
    </form>
  )
}
