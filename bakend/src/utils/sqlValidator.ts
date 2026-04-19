const forbiddenPattern = /\b(insert|update|delete|drop|alter|truncate|grant|revoke|create)\b/i

export function ensureSafeSelectQuery(rawQuery: string): string {
  const query = rawQuery.trim().replace(/;+\s*$/, '')
  if (!query.toLowerCase().startsWith('select')) {
    throw new Error('Only SELECT queries are allowed.')
  }

  if (forbiddenPattern.test(query)) {
    throw new Error('Unsafe SQL detected.')
  }

  if (!/\blimit\s+\d+\b/i.test(query)) {
    return `${query} LIMIT 100`
  }

  return query
}
