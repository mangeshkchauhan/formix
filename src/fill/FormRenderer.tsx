import { useMemo, useState } from 'react'
import { fieldRegistry } from '../fields/registry'
import type { FieldValue, FormTemplate } from '../fields/types'
import { applyCalculations } from '../logic/calculation'
import { resolveFieldStates } from '../logic/conditions'
import { validateForm } from '../logic/validation'
import { Button } from '../components/ui'
import { FieldRenderer } from './FieldRenderer'
import { createInitialValues } from './initialValues'

interface FormRendererProps {
  template: FormTemplate
  initialValues?: Record<string, FieldValue>
  /** When omitted (e.g. Preview), the form is interactive but cannot be submitted. */
  onSubmit?: (values: Record<string, FieldValue>) => void
  readOnly?: boolean
  submitLabel?: string
}

/**
 * Collects only the data that should be persisted/exported: visible input fields.
 * Hidden fields and display-only fields are excluded.
 */
function collectSubmittedValues(
  template: FormTemplate,
  displayValues: Record<string, FieldValue>,
  states: ReturnType<typeof resolveFieldStates>,
): Record<string, FieldValue> {
  const result: Record<string, FieldValue> = {}
  for (const field of template.fields) {
    if (!states[field.id]?.visible) continue
    if (!fieldRegistry[field.type].isInput) continue
    result[field.id] = displayValues[field.id] ?? null
  }
  return result
}

export function FormRenderer({
  template,
  initialValues,
  onSubmit,
  readOnly,
  submitLabel = 'Submit',
}: FormRendererProps) {
  const [values, setValues] = useState<Record<string, FieldValue>>(
    () => initialValues ?? createInitialValues(template),
  )
  const [attempted, setAttempted] = useState(false)

  const states = useMemo(
    () => resolveFieldStates(template.fields, values),
    [template.fields, values],
  )

  // Calculation fields are derived from the current answers in real time.
  const displayValues = useMemo(
    () => applyCalculations(template.fields, values, states),
    [template.fields, values, states],
  )

  const errors = useMemo(
    () => (attempted ? validateForm(template.fields, displayValues, states) : {}),
    [attempted, template.fields, displayValues, states],
  )

  const handleChange = (id: string, value: FieldValue) =>
    setValues((prev) => ({ ...prev, [id]: value }))

  const handleSubmit = () => {
    setAttempted(true)
    const freshStates = resolveFieldStates(template.fields, values)
    const freshDisplay = applyCalculations(template.fields, values, freshStates)
    const validationErrors = validateForm(template.fields, freshDisplay, freshStates)
    if (Object.keys(validationErrors).length > 0) return
    onSubmit?.(collectSubmittedValues(template, freshDisplay, freshStates))
  }

  const errorCount = Object.keys(errors).length

  return (
    <div className="space-y-5">
      {template.fields.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white px-4 py-10 text-center text-sm text-muted">
          This form has no fields yet.
        </p>
      ) : (
        template.fields.map((field) => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={displayValues[field.id] ?? null}
            state={states[field.id] ?? { visible: field.defaultVisible, required: field.defaultRequired }}
            error={errors[field.id]}
            disabled={readOnly}
            onChange={(value) => handleChange(field.id, value)}
          />
        ))
      )}

      {!readOnly && onSubmit ? (
        <div className="flex items-center gap-3 border-t border-line pt-4">
          <Button variant="primary" onClick={handleSubmit}>
            {submitLabel}
          </Button>
          {attempted && errorCount > 0 ? (
            <span className="text-sm font-medium text-red-600">
              Please fix {errorCount} field{errorCount > 1 ? 's' : ''} above.
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
