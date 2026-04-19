import type { DbConfig } from '../types'

interface SidebarProps {
  dbConfig: DbConfig
  onDbConfigChange: (next: DbConfig) => void
}

export function Sidebar({ dbConfig, onDbConfigChange }: SidebarProps) {
  const setField = (field: keyof DbConfig, value: string) => {
    onDbConfigChange({
      ...dbConfig,
      [field]: field === 'port' ? Number(value || 5432) : value
    })
  }

  return (
    <aside className="sidebar">
      <h2>Zenity DB Helper</h2>
      <p>Ask in plain English. The AI will inspect schema and run safe SQL.</p>
      <ul>
        <li>Schema-aware querying</li>
        <li>SELECT-only execution</li>
        <li>Groq tool-calling agent</li>
      </ul>
      <div className="db-config">
        <h3>Database Connection</h3>
        <input value={dbConfig.host} onChange={(e) => setField('host', e.target.value)} placeholder="Host" />
        <input value={String(dbConfig.port)} onChange={(e) => setField('port', e.target.value)} placeholder="Port" />
        <input value={dbConfig.user} onChange={(e) => setField('user', e.target.value)} placeholder="User" />
        <input
          value={dbConfig.password}
          onChange={(e) => setField('password', e.target.value)}
          placeholder="Password"
          type="password"
        />
        <input
          value={dbConfig.database}
          onChange={(e) => setField('database', e.target.value)}
          placeholder="Database"
        />
        <label className="ssl-toggle">
          <input
            type="checkbox"
            checked={Boolean(dbConfig.ssl)}
            onChange={(e) => onDbConfigChange({ ...dbConfig, ssl: e.target.checked })}
          />
          Use SSL (required for Neon)
        </label>
      </div>
    </aside>
  )
}
