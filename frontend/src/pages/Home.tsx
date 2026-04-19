import { useState, useEffect } from 'react'
import { Chat } from '../components/Chat'
import { InputBox } from '../components/InputBox'
import { Sidebar } from '../components/Sidebar'
import { useChat } from '../hooks/useChat'
import type { DbConfig } from '../types'

export function Home() {
  const [dbConfig, setDbConfig] = useState<DbConfig>(() => {
    const saved = localStorage.getItem('zenityDbConfig')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        // ignore error
      }
    }
    return {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: '',
      database: 'postgres',
      ssl: false
    }
  })

  useEffect(() => {
    localStorage.setItem('zenityDbConfig', JSON.stringify(dbConfig))
  }, [dbConfig])

  const { messages, loading, sendMessage } = useChat()

  return (
    <main className="layout">
      <Sidebar dbConfig={dbConfig} onDbConfigChange={setDbConfig} />
      <section className="chat-area">
        <Chat messages={messages} />
        <InputBox loading={loading} dbConfig={dbConfig} onSend={sendMessage} />
      </section>
    </main>
  )
}
