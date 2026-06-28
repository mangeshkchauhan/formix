import { fieldRegistry } from '../fields/registry'
import type { AnyField } from '../fields/types'

const noop = () => {}

/**
 * Renders a field using its real fill-mode Renderer so the builder canvas shows
 * each field as it will actually appear (a textarea looks like a textarea, a date
 * field shows a date picker, etc.). It is non-interactive: the wrapper is made
 * click-through by the caller so clicks select the field instead of editing it.
 */
export function FieldPreview({ field }: { field: AnyField }) {
  const definition = fieldRegistry[field.type]
  const Renderer = definition.Renderer
  const body = (
    <Renderer field={field} value={definition.getEmptyValue(field)} onChange={noop} />
  )

  // Display-only fields (e.g. Section Header) render without label chrome.
  if (!definition.isInput) {
    return <div>{body}</div>
  }

  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-ink">
        {field.label || 'Untitled field'}
        {field.defaultRequired ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      {body}
    </div>
  )
}
