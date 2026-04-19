export function formatRowsForModel(rows: unknown[]): string {
  if (!rows.length) {
    return 'No rows returned.'
  }

  return JSON.stringify(rows, null, 2)
}
