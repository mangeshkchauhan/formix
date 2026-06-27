/**
 * Core domain types for the form builder.
 *
 * Fields are a discriminated union keyed on `type`, so every consumer can switch
 * exhaustively and the compiler enforces handling each field type. Conditional logic
 * is NOT a field type — it is a capability available on every field via `conditions`.
 */

export type FieldType =
  | 'singleLineText'
  | 'multiLineText'
  | 'number'
  | 'date'
  | 'singleSelect'
  | 'multiSelect'
  | 'fileUpload'
  | 'sectionHeader'
  | 'calculation'

/** Groups field types into the sections shown in the Builder palette. */
export type FieldCategory = 'text' | 'numberDate' | 'choice' | 'advanced' | 'layout'

export type Decimals = 0 | 1 | 2 | 3 | 4
export type HeaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type SelectDisplay = 'radio' | 'dropdown' | 'tiles'
export type Aggregation = 'sum' | 'average' | 'min' | 'max'

export interface Option {
  id: string
  label: string
}

/* ------------------------------- Conditions ------------------------------- */

export type ConditionEffect = 'show' | 'hide' | 'require' | 'unrequire'

export type TextOperator = 'equals' | 'notEquals' | 'contains'
export type NumberOperator = 'equals' | 'gt' | 'lt' | 'inRange'
export type SelectOperator = 'equals' | 'notEquals'
export type MultiOperator = 'containsAny' | 'containsAll' | 'containsNone'
export type DateOperator = 'equals' | 'before' | 'after'

export type Operator =
  | TextOperator
  | NumberOperator
  | SelectOperator
  | MultiOperator
  | DateOperator

export interface RangeValue {
  min: number
  max: number
}

export type ConditionValue = string | number | string[] | RangeValue

export interface Condition {
  id: string
  /** The field whose value is evaluated. Must not equal the owning field's id. */
  targetFieldId: string
  operator: Operator
  value: ConditionValue
  effect: ConditionEffect
}

/* --------------------------------- Fields --------------------------------- */

export interface BaseField {
  id: string
  type: FieldType
  label: string
  /** Default visibility when no condition overrides it. */
  defaultVisible: boolean
  /** Default required state; also serves as the per-field "Required" toggle. */
  defaultRequired: boolean
  conditions: Condition[]
}

export interface SingleLineTextField extends BaseField {
  type: 'singleLineText'
  config: {
    placeholder?: string
    minLength?: number
    maxLength?: number
    prefix?: string
    suffix?: string
  }
}

export interface MultiLineTextField extends BaseField {
  type: 'multiLineText'
  config: {
    placeholder?: string
    minLength?: number
    maxLength?: number
    rows: number
  }
}

export interface NumberField extends BaseField {
  type: 'number'
  config: {
    min?: number
    max?: number
    decimals: Decimals
    prefix?: string
    suffix?: string
  }
}

export interface DateField extends BaseField {
  type: 'date'
  config: {
    prefillToday: boolean
    minDate?: string
    maxDate?: string
  }
}

export interface SingleSelectField extends BaseField {
  type: 'singleSelect'
  config: {
    options: Option[]
    display: SelectDisplay
  }
}

export interface MultiSelectField extends BaseField {
  type: 'multiSelect'
  config: {
    options: Option[]
    minSelections?: number
    maxSelections?: number
  }
}

export interface FileUploadField extends BaseField {
  type: 'fileUpload'
  config: {
    allowedTypes: string[]
    maxFiles?: number
  }
}

export interface SectionHeaderField extends BaseField {
  type: 'sectionHeader'
  config: {
    size: HeaderSize
  }
}

export interface CalculationField extends BaseField {
  type: 'calculation'
  config: {
    sourceFieldIds: string[]
    aggregation: Aggregation
    decimals: Decimals
  }
}

export type AnyField =
  | SingleLineTextField
  | MultiLineTextField
  | NumberField
  | DateField
  | SingleSelectField
  | MultiSelectField
  | FileUploadField
  | SectionHeaderField
  | CalculationField

/** Maps a FieldType literal to its concrete field interface. */
export interface FieldTypeMap {
  singleLineText: SingleLineTextField
  multiLineText: MultiLineTextField
  number: NumberField
  date: DateField
  singleSelect: SingleSelectField
  multiSelect: MultiSelectField
  fileUpload: FileUploadField
  sectionHeader: SectionHeaderField
  calculation: CalculationField
}

/* --------------------------------- Values --------------------------------- */

export interface FileMeta {
  name: string
  size: number
  type: string
}

/**
 * A field's answer value. The concrete shape per field type:
 * - text / multiline / date / singleSelect: string
 * - number / calculation: number
 * - multiSelect: string[] (option ids)
 * - fileUpload: FileMeta[]
 * - empty: null
 */
export type FieldValue = string | number | string[] | FileMeta[] | null

/* ------------------------------ Persistence ------------------------------- */

export interface FormTemplate {
  id: string
  title: string
  fields: AnyField[]
  favorite: boolean
  createdAt: string
  updatedAt: string
}

export interface FormInstance {
  id: string
  templateId: string
  values: Record<string, FieldValue>
  submittedAt: string
}
