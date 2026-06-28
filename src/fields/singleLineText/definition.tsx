import { IconText } from '../../components/icons'
import { ConfigRow, TextInput } from '../../components/ui'
import { defineField } from '../contract'
import type { SingleLineTextField } from '../types'
import { asString, isEmptyValue } from '../value'

export const singleLineTextDefinition = defineField<SingleLineTextField>({
  type: 'singleLineText',
  paletteLabel: 'Single Line Text',
  paletteDescription: 'A single-line text input',
  category: 'text',
  icon: <IconText />,
  isInput: true,
  createDefault: (id) => ({
    id,
    type: 'singleLineText',
    label: 'Untitled text field',
    defaultVisible: true,
    defaultRequired: false,
    conditions: [],
    config: {},
  }),
  getEmptyValue: () => '',
  ConfigPanel: ({ field, onChange }) => {
    const set = (patch: Partial<SingleLineTextField['config']>) =>
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ConfigRow label="Prefix">
            <TextInput
              value={field.config.prefix ?? ''}
              onChange={(e) => set({ prefix: e.target.value })}
              placeholder="https://"
            />
          </ConfigRow>
          <ConfigRow label="Suffix">
            <TextInput
              value={field.config.suffix ?? ''}
              onChange={(e) => set({ suffix: e.target.value })}
              placeholder=".com"
            />
          </ConfigRow>
        </div>
      </>
    )
  },
  Renderer: ({ field, value, onChange, disabled }) => {
    const text = asString(value)
    return (
      <div className="flex items-stretch rounded-lg border border-line bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        {field.config.prefix ? (
          <span className="flex items-center border-r border-line bg-canvas px-3 text-sm text-muted">
            {field.config.prefix}
          </span>
        ) : null}
        <input
          className="w-full bg-transparent px-3 py-2 text-sm text-ink outline-none disabled:cursor-not-allowed"
          value={text}
          disabled={disabled}
          placeholder={field.config.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {field.config.suffix ? (
          <span className="flex items-center border-l border-line bg-canvas px-3 text-sm text-muted">
            {field.config.suffix}
          </span>
        ) : null}
      </div>
    )
  },
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
