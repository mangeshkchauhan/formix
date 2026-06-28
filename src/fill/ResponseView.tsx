import { fieldRegistry } from '../fields/registry'
import { headerSizeClasses } from '../fields/sectionHeader/definition'
import type { FormInstance, FormTemplate } from '../fields/types'
import { applyCalculations } from '../logic/calculation'
import { resolveFieldStates } from '../logic/conditions'
import { formatDateTime } from '../lib/format'

interface ResponseViewProps {
  template: FormTemplate
  instance: FormInstance
}

/**
 * Read-only, in-app rendering of a submitted response. Visibility is re-resolved from
 * the stored values so conditionally hidden fields never appear.
 */
export function ResponseView({ template, instance }: ResponseViewProps) {
  const states = resolveFieldStates(template.fields, instance.values)
  const display = applyCalculations(template.fields, instance.values, states)

  return (
    <div>
      <div className="mb-4 border-b border-line pb-3">
        <h3 className="text-lg font-semibold text-ink">{template.title}</h3>
        <p className="text-xs text-muted">
          Submitted {formatDateTime(instance.submittedAt)}
        </p>
      </div>

      <dl className="space-y-4">
        {template.fields.map((field) => {
          if (!states[field.id]?.visible) return null
          const definition = fieldRegistry[field.type]

          if (field.type === 'sectionHeader') {
            return (
              <div key={field.id} className="pt-2">
                <span className={headerSizeClasses[field.config.size]}>
                  {field.label}
                </span>
              </div>
            )
          }

          if (!definition.isInput) return null

          const value = definition.toPdf(field, display[field.id] ?? null)
          return (
            <div key={field.id}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                {field.label}
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink">
                {value || <span className="text-muted">—</span>}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
