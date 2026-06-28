import { round } from '../lib/format'
import type { AnyField, CalculationField, FieldValue } from '../fields/types'
import { asNumber } from '../fields/value'
import type { FieldStates } from './conditions'

/**
 * Computes a single calculation field's value from its source Number fields.
 * Hidden source fields are excluded. Returns null when no source has a value.
 */
export function computeCalculation(
  field: CalculationField,
  fields: AnyField[],
  values: Record<string, FieldValue>,
  states: FieldStates,
): number | null {
  const byId = new Map(fields.map((f) => [f.id, f]))

  const numbers: number[] = []
  for (const sourceId of field.config.sourceFieldIds) {
    const source = byId.get(sourceId)
    // Only Number fields are valid sources (never another calculation).
    if (!source || source.type !== 'number') continue
    // Hidden sources are excluded, consistent with hidden values not counting.
    if (states[sourceId] && !states[sourceId].visible) continue
    const num = asNumber(values[sourceId] ?? null)
    if (num !== null) numbers.push(num)
  }

  if (numbers.length === 0) return null

  let result: number
  switch (field.config.aggregation) {
    case 'sum':
      result = numbers.reduce((acc, n) => acc + n, 0)
      break
    case 'average':
      result = numbers.reduce((acc, n) => acc + n, 0) / numbers.length
      break
    case 'min':
      result = Math.min(...numbers)
      break
    case 'max':
      result = Math.max(...numbers)
      break
  }

  return round(result, field.config.decimals)
}

/**
 * Returns a new values map with every calculation field's value computed.
 * Calculation fields never source other calculation fields, so a single pass
 * after resolving states is sufficient.
 */
export function applyCalculations(
  fields: AnyField[],
  values: Record<string, FieldValue>,
  states: FieldStates,
): Record<string, FieldValue> {
  let next = values
  for (const field of fields) {
    if (field.type !== 'calculation') continue
    const computed = computeCalculation(field, fields, values, states)
    if (next[field.id] !== computed) {
      next = { ...next, [field.id]: computed }
    }
  }
  return next
}
