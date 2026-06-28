import { fieldRegistry } from '../fields/registry'
import type { AnyField } from '../fields/types'

/** Per-field builder-time configuration problems, keyed by field id. */
export type ConfigErrors = Record<string, string[]>

/**
 * Validates every field's builder-time configuration before a template is saved.
 *
 * A non-empty label is required for every field type (the spec lists "Label" as a
 * required option on all ten), so that check lives here centrally. Type-specific
 * rules (e.g. a Calculation needs a source, a Select needs options) are delegated
 * to each field's `validateConfig`, keeping the per-field contract self-contained.
 */
export function collectConfigErrors(fields: AnyField[]): ConfigErrors {
  const errors: ConfigErrors = {}

  for (const field of fields) {
    const messages: string[] = []

    if (!field.label.trim()) messages.push('Label is required.')

    const definition = fieldRegistry[field.type]
    if (definition.validateConfig) {
      messages.push(...definition.validateConfig(field, fields))
    }

    if (messages.length > 0) errors[field.id] = messages
  }

  return errors
}

export function hasConfigErrors(errors: ConfigErrors): boolean {
  return Object.keys(errors).length > 0
}
