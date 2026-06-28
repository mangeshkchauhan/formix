import { IconTextArea } from '../../components/icons'
import { ConfigRow, TextArea, TextInput } from '../../components/ui'
import { defineField } from '../contract'
import type { MultiLineTextField } from '../types'
import { asString, isEmptyValue } from '../value'

export const multiLineTextDefinition = defineField<MultiLineTextField>({
  type: 'multiLineText',
  paletteLabel: 'Multi-line Text',
  paletteDescription: 'A multi-row textarea',
  category: 'text',
  icon: <IconTextArea />,
  isInput: true,
  createDefault: (id) => ({
    id,
    type: 'multiLineText',
    label: 'Untitled paragraph field',
    defaultVisible: true,
    defaultRequired: false,
    conditions: [],
    config: { rows: 4 },
  }),
  getEmptyValue: () => '',
  ConfigPanel: ({ field, onChange }) => {
    const set = (patch: Partial<MultiLineTextField['config']>) =>
      onChange({ ...field, config: { ...field.config, ...patch } })
    return (
      <>
        <ConfigRow label="Placeholder">
          <TextInput
            value={field.config.placeholder ?? ''}
            onChange={(e) => set({ placeholder: e.target.value })}
            placeholder="Hint shown when empty"
          />
        </ConfigRow>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ConfigRow label="Min length">
            <TextInput
              type="number"
              min={0}
              value={field.config.minLength ?? ''}
              onChange={(e) =>
                set({
                  minLength: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </ConfigRow>
          <ConfigRow label="Max length">
            <TextInput
              type="number"
              min={0}
              value={field.config.maxLength ?? ''}
              onChange={(e) =>
                set({
                  maxLength: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </ConfigRow>
        </div>
        <ConfigRow label="Visible rows">
          <TextInput
            type="number"
            min={1}
            max={20}
            value={field.config.rows}
            onChange={(e) => set({ rows: Math.max(1, Number(e.target.value) || 1) })}
          />
        </ConfigRow>
      </>
    )
  },
  Renderer: ({ field, value, onChange, disabled }) => (
    <TextArea
      rows={field.config.rows}
      value={asString(value)}
      disabled={disabled}
      placeholder={field.config.placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  validate: (field, value) => {
    if (isEmptyValue(value)) return null
    const text = asString(value)
    const { minLength, maxLength } = field.config
    if (minLength !== undefined && text.length < minLength) {
      return `Must be at least ${minLength} characters`
    }
    if (maxLength !== undefined && text.length > maxLength) {
      return `Must be at most ${maxLength} characters`
    }
    return null
  },
  validateConfig: (field) => {
    const { minLength, maxLength } = field.config
    return minLength !== undefined && maxLength !== undefined && minLength > maxLength
      ? ['Min length cannot exceed max length.']
      : []
  },
  toPdf: (_field, value) => asString(value),
  operators: [
    { value: 'equals', label: 'equals' },
    { value: 'notEquals', label: 'does not equal' },
    { value: 'contains', label: 'contains' },
  ],
  evaluate: (operator, fieldValue, conditionValue) => {
    const a = asString(fieldValue).toLowerCase()
    const b = String(conditionValue ?? '').toLowerCase()
    switch (operator) {
      case 'equals':
        return a === b
      case 'notEquals':
        return a !== b
      case 'contains':
        return a.includes(b)
      default:
        return false
    }
  },
})
