import type { FieldValue, FileMeta } from './types'

/** True when a field's answer counts as "no value provided". */
export function isEmptyValue(value: FieldValue): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'number') return Number.isNaN(value)
  return false
}

export function asString(value: FieldValue): string {
  return typeof value === 'string' ? value : ''
}

export function asNumber(value: FieldValue): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

export function asStringArray(value: FieldValue): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

export function asFileList(value: FieldValue): FileMeta[] {
  if (Array.isArray(value) && (value.length === 0 || typeof value[0] === 'object')) {
    return value as FileMeta[]
  }
  return []
}
