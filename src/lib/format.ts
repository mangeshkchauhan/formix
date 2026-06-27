/** Rounds a number to a fixed number of decimal places. */
export function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/** Formats a number to a fixed number of decimals (used by Number + Calculation). */
export function formatNumber(value: number, decimals: number): string {
  return round(value, decimals).toFixed(decimals)
}

/** Formats a byte count into a human-readable size. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let size = bytes / 1024
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/** Formats an ISO date/datetime string for display. Returns '' for empty input. */
export function formatDateTime(iso: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/** Formats an ISO date (yyyy-mm-dd) for display. Returns '' for empty input. */
export function formatDate(iso: string): string {
  if (!iso) return ''
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

/** Today's date as yyyy-mm-dd in local time. */
export function todayIso(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}
