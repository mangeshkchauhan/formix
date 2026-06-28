import { fieldRegistry } from '../fields/registry'
import type { AnyField, FieldValue } from '../fields/types'
import type { FieldState } from '../logic/conditions'
import { FieldError, FieldLabel } from '../components/ui'

interface FieldRendererProps {
  field: AnyField
  value: FieldValue
  state: FieldState
  error?: string
  disabled?: boolean
  onChange: (value: FieldValue) => void
}

export function FieldRenderer({
  field,
  value,
  state,
  error,
  disabled,
  onChange,
}: FieldRendererProps) {
  if (!state.visible) return null

  const definition = fieldRegistry[field.type]
  const Renderer = definition.Renderer

  // Display-only fields (Section Header) render without label/error chrome.
  if (!definition.isInput) {
    return (
      <div className="pt-2">
        <Renderer field={field} value={value} onChange={onChange} disabled={disabled} />
      </div>
    )
  }

  return (
    <div>
      <FieldLabel required={state.required}>{field.label}</FieldLabel>
      <Renderer
        field={field}
        value={value}
        onChange={onChange}
        disabled={disabled}
        error={error}
      />
      <FieldError message={error} />
    </div>
  )
}
