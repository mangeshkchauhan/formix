import { fieldRegistry } from '../fields/registry'
import type {
  AnyField,
  Condition,
  ConditionEffect,
  ConditionValue,
  Operator,
  RangeValue,
} from '../fields/types'
import { createId } from '../lib/id'
import { Button, Select, TextInput } from '../components/ui'
import { IconPlus, IconTrash } from '../components/icons'

interface ConditionsEditorProps {
  field: AnyField
  allFields: AnyField[]
  onChange: (conditions: Condition[]) => void
}

const EFFECTS: { value: ConditionEffect; label: string }[] = [
  { value: 'show', label: 'Show this field' },
  { value: 'hide', label: 'Hide this field' },
  { value: 'require', label: 'Mark as required' },
  { value: 'unrequire', label: 'Mark as not required' },
]

/** Default condition value for a freshly chosen target + operator. */
function defaultValueFor(target: AnyField, operator: Operator): ConditionValue {
  if (operator === 'inRange') return { min: 0, max: 0 }
  if (target.type === 'multiSelect') return []
  if (target.type === 'number') return 0
  return ''
}

export function ConditionsEditor({ field, allFields, onChange }: ConditionsEditorProps) {
  // Valid targets: any other field that exposes operators (text, number, selects, date).
  const targets = allFields.filter(
    (f) => f.id !== field.id && fieldRegistry[f.type].operators?.length,
  )

  const addCondition = () => {
    const target = targets[0]
    if (!target) return
    const operator = fieldRegistry[target.type].operators![0].value
    const condition: Condition = {
      id: createId('cond'),
      targetFieldId: target.id,
      operator,
      value: defaultValueFor(target, operator),
      effect: 'show',
    }
    onChange([...field.conditions, condition])
  }

  const updateCondition = (id: string, patch: Partial<Condition>) =>
    onChange(field.conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  const removeCondition = (id: string) =>
    onChange(field.conditions.filter((c) => c.id !== id))

  if (targets.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line bg-canvas px-3 py-2 text-xs text-muted">
        Add another input field (text, number, select, or date) to create conditions.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {field.conditions.map((condition) => {
        const target = allFields.find((f) => f.id === condition.targetFieldId)
        const operators = target ? fieldRegistry[target.type].operators ?? [] : []
        return (
          <div
            key={condition.id}
            className="space-y-2 rounded-lg border border-line bg-canvas p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                When
              </span>
              <Button
                variant="ghost"
                aria-label="Remove condition"
                onClick={() => removeCondition(condition.id)}
              >
                <IconTrash />
              </Button>
            </div>

            <Select
              value={condition.targetFieldId}
              onChange={(e) => {
                const nextTarget = allFields.find((f) => f.id === e.target.value)
                if (!nextTarget) return
                const nextOperator = fieldRegistry[nextTarget.type].operators![0].value
                updateCondition(condition.id, {
                  targetFieldId: nextTarget.id,
                  operator: nextOperator,
                  value: defaultValueFor(nextTarget, nextOperator),
                })
              }}
            >
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label || 'Untitled field'}
                </option>
              ))}
            </Select>

            <Select
              value={condition.operator}
              onChange={(e) => {
                const nextOperator = e.target.value as Operator
                updateCondition(condition.id, {
                  operator: nextOperator,
                  value: target ? defaultValueFor(target, nextOperator) : '',
                })
              }}
            >
              {operators.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </Select>

            {target ? (
              <ConditionValueInput
                target={target}
                operator={condition.operator}
                value={condition.value}
                onChange={(value) => updateCondition(condition.id, { value })}
              />
            ) : null}

            <Select
              value={condition.effect}
              onChange={(e) =>
                updateCondition(condition.id, {
                  effect: e.target.value as ConditionEffect,
                })
              }
            >
              {EFFECTS.map((eff) => (
                <option key={eff.value} value={eff.value}>
                  {eff.label}
                </option>
              ))}
            </Select>
          </div>
        )
      })}

      <Button variant="secondary" onClick={addCondition} className="w-full">
        <IconPlus /> Add condition
      </Button>
    </div>
  )
}

interface ConditionValueInputProps {
  target: AnyField
  operator: Operator
  value: ConditionValue
  onChange: (value: ConditionValue) => void
}

function ConditionValueInput({
  target,
  operator,
  value,
  onChange,
}: ConditionValueInputProps) {
  if (operator === 'inRange') {
    const range = (value as RangeValue) ?? { min: 0, max: 0 }
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <TextInput
          type="number"
          value={range.min}
          onChange={(e) => onChange({ ...range, min: Number(e.target.value) })}
          placeholder="Min"
        />
        <TextInput
          type="number"
          value={range.max}
          onChange={(e) => onChange({ ...range, max: Number(e.target.value) })}
          placeholder="Max"
        />
      </div>
    )
  }

  if (target.type === 'singleSelect') {
    return (
      <Select value={String(value)} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {target.config.options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </Select>
    )
  }

  if (target.type === 'multiSelect') {
    const selected = Array.isArray(value) ? (value as string[]) : []
    const toggle = (id: string) =>
      onChange(
        selected.includes(id)
          ? selected.filter((s) => s !== id)
          : [...selected, id],
      )
    return (
      <div className="space-y-1.5">
        {target.config.options.map((o) => (
          <label
            key={o.id}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-sm"
          >
            <input
              type="checkbox"
              checked={selected.includes(o.id)}
              onChange={() => toggle(o.id)}
              className="accent-brand"
            />
            {o.label}
          </label>
        ))}
      </div>
    )
  }

  if (target.type === 'number') {
    return (
      <TextInput
        type="number"
        value={value === '' || value === null ? '' : Number(value)}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        placeholder="Value"
      />
    )
  }

  if (target.type === 'date') {
    return (
      <TextInput
        type="date"
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  return (
    <TextInput
      value={String(value)}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Value"
    />
  )
}
