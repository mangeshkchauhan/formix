import { IconRadio } from '../../components/icons'
import { OptionsEditor } from '../../components/OptionsEditor'
import { ConfigRow, Select } from '../../components/ui'
import { createId } from '../../lib/id'
import { defineField } from '../contract'
import type { SelectDisplay, SingleSelectField } from '../types'
import { asString, isEmptyValue } from '../value'

const DISPLAY_OPTIONS: { value: SelectDisplay; label: string }[] = [
  { value: 'radio', label: 'Radio' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'tiles', label: 'Tiles' },
]

export const singleSelectDefinition = defineField<SingleSelectField>({
  type: 'singleSelect',
  paletteLabel: 'Single Select',
  paletteDescription: 'Pick one option from a list',
  category: 'choice',
  icon: <IconRadio />,
  isInput: true,
  createDefault: (id) => ({
    id,
    type: 'singleSelect',
    label: 'Untitled single select',
    defaultVisible: true,
    defaultRequired: false,
    conditions: [],
    config: {
      display: 'radio',
      options: [
        { id: createId('opt'), label: 'Option 1' },
        { id: createId('opt'), label: 'Option 2' },
      ],
    },
  }),
  getEmptyValue: () => '',
  ConfigPanel: ({ field, onChange }) => {
    const set = (patch: Partial<SingleSelectField['config']>) =>
      onChange({ ...field, config: { ...field.config, ...patch } })
    return (
      <>
        <ConfigRow label="Display type">
          <Select
            value={field.config.display}
            onChange={(e) => set({ display: e.target.value as SelectDisplay })}
          >
            {DISPLAY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </ConfigRow>
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
    const selected = asString(value)
    const { options, display } = field.config

    if (display === 'dropdown') {
      return (
        <Select
          value={selected}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select an option…</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
      )
    }

    if (display === 'tiles') {
      return (
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const active = selected === o.id
            return (
              <button
                key={o.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(o.id)}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'border-brand bg-brand-soft text-brand'
                    : 'border-line bg-white text-ink hover:border-brand/40'
                }`}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {options.map((o) => (
          <label
            key={o.id}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
          >
            <input
              type="radio"
              name={field.id}
              checked={selected === o.id}
              disabled={disabled}
              onChange={() => onChange(o.id)}
              className="accent-brand"
            />
            {o.label}
          </label>
        ))}
      </div>
    )
  },
  validate: () => null,
  validateConfig: (field) => {
    const errors: string[] = []
    if (field.config.options.length === 0) errors.push('Add at least one option.')
    if (field.config.options.some((o) => !o.label.trim())) {
      errors.push('Every option needs a label.')
    }
    return errors
  },
  toPdf: (field, value) => {
    const selected = asString(value)
    return field.config.options.find((o) => o.id === selected)?.label ?? ''
  },
  operators: [
    { value: 'equals', label: 'equals' },
    { value: 'notEquals', label: 'does not equal' },
  ],
  evaluate: (operator, fieldValue, conditionValue) => {
    if (isEmptyValue(fieldValue)) return operator === 'notEquals'
    const a = asString(fieldValue)
    const b = String(conditionValue ?? '')
    return operator === 'equals' ? a === b : a !== b
  },
})
