import type { FieldDefinition } from './contract'
import type { AnyField, FieldCategory, FieldType } from './types'

import { singleLineTextDefinition } from './singleLineText/definition'
import { multiLineTextDefinition } from './multiLineText/definition'
import { numberDefinition } from './number/definition'
import { dateDefinition } from './date/definition'
import { singleSelectDefinition } from './singleSelect/definition'
import { multiSelectDefinition } from './multiSelect/definition'
import { fileUploadDefinition } from './fileUpload/definition'
import { sectionHeaderDefinition } from './sectionHeader/definition'
import { calculationDefinition } from './calculation/definition'

/**
 * The single source of truth for field types. To add an 11th field type, create a
 * folder under `fields/` with a `definition.tsx` and add one entry here — no other
 * file needs editing.
 */
export const fieldRegistry: Record<FieldType, FieldDefinition> = {
  singleLineText: singleLineTextDefinition,
  multiLineText: multiLineTextDefinition,
  number: numberDefinition,
  date: dateDefinition,
  singleSelect: singleSelectDefinition,
  multiSelect: multiSelectDefinition,
  fileUpload: fileUploadDefinition,
  sectionHeader: sectionHeaderDefinition,
  calculation: calculationDefinition,
}

/** Ordered list used to render the Builder palette. */
export const fieldDefinitions: FieldDefinition[] = Object.values(fieldRegistry)

/** Palette section labels, in display order. */
export const fieldCategories: { key: FieldCategory; label: string }[] = [
  { key: 'layout', label: 'Layout' },
  { key: 'text', label: 'Text' },
  { key: 'numberDate', label: 'Number & Date' },
  { key: 'choice', label: 'Choice' },
  { key: 'advanced', label: 'Advanced' },
]

/** Field definitions grouped by category, in palette display order. Empty groups are omitted. */
export function getFieldDefinitionsByCategory(): {
  key: FieldCategory
  label: string
  definitions: FieldDefinition[]
}[] {
  return fieldCategories
    .map(({ key, label }) => ({
      key,
      label,
      definitions: fieldDefinitions.filter((definition) => definition.category === key),
    }))
    .filter((group) => group.definitions.length > 0)
}

export function getFieldDefinition(type: FieldType): FieldDefinition {
  return fieldRegistry[type]
}

/** Fields that can serve as conditional-logic targets (those exposing operators). */
export function canBeConditionTarget(field: AnyField): boolean {
  return Boolean(fieldRegistry[field.type].operators?.length)
}
