import { fieldRegistry } from '../fields/registry'
import type { AnyField, Condition } from '../fields/types'
import { ConfigRow, FieldLabel, Select, TextInput, Toggle } from '../components/ui'
import { ConditionsEditor } from './ConditionsEditor'

interface ConfigPanelProps {
  field: AnyField | null
  allFields: AnyField[]
  onChange: (field: AnyField) => void
  /** Builder-time config problems for the selected field, shown after a blocked save. */
  errors?: string[]
}

export function ConfigPanel({ field, allFields, onChange, errors }: ConfigPanelProps) {
  if (!field) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">
        Select a field to configure it.
      </div>
    )
  }

  const definition = fieldRegistry[field.type]
  const SpecificPanel = definition.ConfigPanel

  return (
    <div className="space-y-6 p-4">
      {errors && errors.length > 0 ? (
        <ul className="space-y-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-brand">
          {definition.paletteLabel}
        </span>
        <ConfigRow label="Label">
          <TextInput
            value={field.label}
            onChange={(e) => onChange({ ...field, label: e.target.value })}
            placeholder="Field label"
          />
        </ConfigRow>

        <SpecificPanel field={field} onChange={onChange} allFields={allFields} />
      </div>

      {definition.isInput ? (
        <div className="border-t border-line pt-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Default state
          </h3>
          <div className="space-y-2">
            <Toggle
              label="Required"
              checked={field.defaultRequired}
              onChange={(checked) => onChange({ ...field, defaultRequired: checked })}
            />
            <ConfigRow label="Default visibility">
              <Select
                value={field.defaultVisible ? 'visible' : 'hidden'}
                onChange={(e) =>
                  onChange({ ...field, defaultVisible: e.target.value === 'visible' })
                }
              >
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </Select>
            </ConfigRow>
          </div>
        </div>
      ) : null}

      <div className="border-t border-line pt-4">
        <FieldLabel>Conditional logic</FieldLabel>
        <p className="mb-3 text-xs text-muted">
          Conditions are applied in order; the last match wins per effect.
        </p>
        <ConditionsEditor
          field={field}
          allFields={allFields}
          onChange={(conditions: Condition[]) => onChange({ ...field, conditions })}
        />
      </div>
    </div>
  )
}
