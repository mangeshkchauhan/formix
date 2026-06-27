import type { ComponentType, ReactNode } from 'react'
import type {
  AnyField,
  Condition,
  ConditionValue,
  FieldCategory,
  FieldValue,
  Operator,
} from './types'

/** Props passed to a field's Builder-Mode configuration panel. */
export interface FieldConfigPanelProps<F extends AnyField> {
  field: F
  onChange: (field: F) => void
  /** All fields in the form, used by e.g. Calculation source pickers. */
  allFields: AnyField[]
}

/** Props passed to a field's Fill-Mode renderer. */
export interface FieldRendererProps<F extends AnyField> {
  field: F
  value: FieldValue
  onChange: (value: FieldValue) => void
  error?: string
  disabled?: boolean
}

export interface OperatorOption {
  value: Operator
  label: string
}

/**
 * The single contract every field type implements. Every UI surface (palette,
 * config panel, fill renderer, validation, PDF, conditional logic) reads from this,
 * so adding a new field type only requires creating one definition and registering it.
 */
export interface FieldDefinition<F extends AnyField = AnyField> {
  type: F['type']
  paletteLabel: string
  paletteDescription: string
  /** The palette section this field type is grouped under. */
  category: FieldCategory
  icon: ReactNode
  /** False for display-only fields (Section Header) that capture no value. */
  isInput: boolean
  /** Builds a new field with sensible defaults. */
  createDefault: (id: string) => F
  ConfigPanel: ComponentType<FieldConfigPanelProps<F>>
  Renderer: ComponentType<FieldRendererProps<F>>
  /** The empty/initial answer value for a fresh instance. */
  getEmptyValue: (field: F) => FieldValue
  /** Returns an error message, or null when valid. Required-ness is handled separately. */
  validate: (field: F, value: FieldValue) => string | null
  /**
   * Builder-time validation of the field's own configuration (not a user answer).
   * Returns human-readable problems that must block saving the template; an empty
   * array means the config is valid. The generic "Label is required" check lives in
   * the collector, so this only covers type-specific rules.
   */
  validateConfig?: (field: F, allFields: AnyField[]) => string[]
  /** Formats the answer for PDF export. Return '' to omit the value line. */
  toPdf: (field: F, value: FieldValue) => string
  /** Operators available when this field is a conditional-logic target. */
  operators?: OperatorOption[]
  /** Evaluates a condition predicate against this field's value. */
  evaluate?: (
    operator: Operator,
    fieldValue: FieldValue,
    conditionValue: Condition['value'],
  ) => boolean
}

/**
 * Identity helper that type-checks a definition against its concrete field type,
 * then erases it to the general `FieldDefinition` for storage in the registry.
 * The erasure side-steps React component prop contravariance at the registry boundary
 * while preserving full type-safety inside each definition's implementation.
 */
export function defineField<F extends AnyField>(
  definition: FieldDefinition<F>,
): FieldDefinition {
  return definition as unknown as FieldDefinition
}

export type { AnyField, ConditionValue, FieldCategory, FieldValue, Operator }
