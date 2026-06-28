import { fieldRegistry } from '../fields/registry'
import type { AnyField, FieldValue } from '../fields/types'
import { isEmptyValue } from '../fields/value'
import type { FieldStates } from './conditions'

export type ValidationErrors = Record<string, string>

/**
 * Validates visible fields against their computed required state and per-type rules.
 * Hidden fields are skipped entirely — a hidden required field never blocks submission.
 */
export function validateForm(
  fields: AnyField[],
  values: Record<string, FieldValue>,
  states: FieldStates,
): ValidationErrors {
  const errors: ValidationErrors = {}

  for (const field of fields) {
    const state = states[field.id]
    if (!state || !state.visible) continue

    const definition = fieldRegistry[field.type]
    if (!definition.isInput) continue

    const value = values[field.id] ?? null

    if (state.required && isEmptyValue(value)) {
      errors[field.id] = 'This field is required'
      continue
    }

    const message = definition.validate(field, value)
    if (message) errors[field.id] = message
  }

  return errors
}
