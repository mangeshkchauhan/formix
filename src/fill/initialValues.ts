import { fieldRegistry } from '../fields/registry'
import { todayIso } from '../lib/format'
import type { FieldValue, FormTemplate } from '../fields/types'

/**
 * Builds the starting answer map for a fresh form instance, honouring the Date
 * field's "pre-fill with today" option.
 */
export function createInitialValues(
  template: FormTemplate,
): Record<string, FieldValue> {
  const values: Record<string, FieldValue> = {}
  for (const field of template.fields) {
    if (field.type === 'date' && field.config.prefillToday) {
      values[field.id] = todayIso()
      continue
    }
    values[field.id] = fieldRegistry[field.type].getEmptyValue(field)
  }
  return values
}
