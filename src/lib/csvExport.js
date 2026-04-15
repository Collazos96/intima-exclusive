/**
 * Genera y descarga un CSV UTF-8 con BOM para que Excel abra bien los acentos.
 * rows: array de objetos planos. columns: [{ key, label }] define orden y header.
 */

function escapeCsv(value) {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function downloadCsv(filename, columns, rows) {
  const header = columns.map((c) => escapeCsv(c.label)).join(',')
  const body = rows
    .map((r) => columns.map((c) => escapeCsv(r[c.key])).join(','))
    .join('\n')
  const csv = '\uFEFF' + header + '\n' + body  // BOM = Excel detecta UTF-8

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
