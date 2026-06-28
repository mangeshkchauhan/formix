import { IconCheckList } from '../../components/icons'
import { OptionsEditor } from '../../components/OptionsEditor'
import { ConfigRow, TextInput } from '../../components/ui'
import { createId } from '../../lib/id'
import { defineField } from '../contract'
import type { MultiSelectField } from '../types'
import { asStringArray } from '../value'

export const multiSelectDefinition = defineField<MultiSelectField>({
  type: 'multiSelect',
  paletteLabel: 'Multi Select',
  paletteDescription: 'Pick multiple options from a list',
  category: 'choice',
  icon: <IconCheckList />,
  isInput: true,
  createDefault: (id) => ({
    id,
    type: 'multiSelect',
    label: 'Untitled multi select',
    defaultVisible: true,
    defaultRequired: false,
    conditions: [],
    config: {
      options: [
        { id: createId('opt'), label: 'Option 1' },
        { id: createId('opt'), label: 'Option 2' },
      ],
    },
  }),
  getEmptyValue: () => [],
  ConfigPanel: ({ field, onChange }) => {
    const set = (patch: Partial<MultiSelectField['config']>) =>
      onChange({ ...field, config: { ...field.config, ...patch } })
    return (
      <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ConfigRow label="Min selections">
            <TextInput
              type="number"
              min={0}
              value={field.config.minSelections ?? ''}
              onChange={(e) =>
                set({
                  minSelections:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </ConfigRow>
          <ConfigRow label="Max selections">
            <TextInput
              type="number"
              min={0}
              value={field.config.maxSelections ?? ''}
              onChange={(e) =>
                set({
                  maxSelections:
                    e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </ConfigRow>
        </div>
        <ConfigRow label="Options">
          <OptionsEditor
            options={field.config.options}
            onChange={(options) => set({ options })}
          />
        </ConfigRow>
      </>
    )
  },
  Renderer: ({ field, value, onChange, disabled }) => {
    const selected = asStringArray(value)
    const toggle = (id: string) =>
      onChange(
        selected.includes(id)
          ? selected.filter((s) => s !== id)
          : [...selected, id],
      )
    return (
      <div className="space-y-2">
        {field.config.options.map((o) => (
          <label
            key={o.id}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
          >
            <input
              type="checkbox"
              checked={selected.includes(o.id)}
              disabled={disabled}
              onChange={() => toggle(o.id)}
              className="accent-brand"
            />
            {o.label}
          </label>
        ))}
      </div>
    )
  },
  validate: (field, value) => {
    const selected = asStringArray(value)
    const { minSelections, maxSelections } = field.config
    if (selected.length === 0) return null
    if (minSelections !== undefined && selected.length < minSelections) {
      return `Select at least ${minSelections} option(s)`
    }
    if (maxSelections !== undefined && selected.length > maxSelections) {
      return `Select at most ${maxSelections} option(s)`
    }
    return null
  },
  validateConfig: (field) => {
    const errors: string[] = []
    const { options, minSelections, maxSelections } = field.config
    if (options.length === 0) errors.push('Add at least one option.')
    if (options.some((o) => !o.label.trim())) {
      errors.push('Every option needs a label.')
    }
    if (
      minSelections !== undefined &&
      maxSelections !== undefined &&
      minSelections > maxSelections
    ) {
      errors.push('Min selections cannot exceed max selections.')
    }
    if (
      maxSelections !== undefined &&
      options.length > 0 &&
      maxSelections > options.length
    ) {
      errors.push('Max selections cannot exceed the number of options.')
    }
    return errors
  },
  toPdf: (field, value) => {
    const selected = asStringArray(value)
    return field.config.options
      .filter((o) => selected.includes(o.id))
      .map((o) => o.label)
      .join(', ')
  },
  operators: [
    { value: 'containsAny', label: 'contains any of' },
    { value: 'containsAll', label: 'contains all of' },
    { value: 'containsNone', label: 'contains none of' },
  ],
  evaluate: (operator, fieldValue, conditionValue) => {
    const selected = asStringArray(fieldValue)
    const targets = Array.isArray(conditionValue)
      ? conditionValue.map(String)
      : [String(conditionValue ?? '')]
    switch (operator) {
      case 'containsAny':
        return targets.some((t) => selected.includes(t))
      case 'containsAll':
        return targets.every((t) => selected.includes(t))
      case 'containsNone':
        return !targets.some((t) => selected.includes(t))
      default:
        return false
    }
  },
})
