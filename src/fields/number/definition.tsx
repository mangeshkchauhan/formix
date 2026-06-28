import { IconNumber } from '../../components/icons'
import { ConfigRow, Select, TextInput } from '../../components/ui'
import { formatNumber } from '../../lib/format'
import { defineField } from '../contract'
import type { Decimals, NumberField, RangeValue } from '../types'
import { asNumber, isEmptyValue } from '../value'

const DECIMAL_OPTIONS: Decimals[] = [0, 1, 2, 3, 4]

export const numberDefinition = defineField<NumberField>({
  type: 'number',
  paletteLabel: 'Number',
  paletteDescription: 'A numeric input',
  category: 'numberDate',
  icon: <IconNumber />,
  isInput: true,
  createDefault: (id) => ({
    id,
    type: 'number',
    label: 'Untitled number field',
    defaultVisible: true,
    defaultRequired: false,
    conditions: [],
    config: { decimals: 0 },
  }),
  getEmptyValue: () => null,
  ConfigPanel: ({ field, onChange }) => {
    const set = (patch: Partial<NumberField['config']>) =>
      onChange({ ...field, config: { ...field.config, ...patch } })
    return (
      <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ConfigRow label="Min value">
            <TextInput
              type="number"
              value={field.config.min ?? ''}
              onChange={(e) =>
                set({ min: e.target.value === '' ? undefined : Number(e.target.value) })
              }
            />
          </ConfigRow>
          <ConfigRow label="Max value">
            <TextInput
              type="number"
              value={field.config.max ?? ''}
              onChange={(e) =>
                set({ max: e.target.value === '' ? undefined : Number(e.target.value) })
              }
            />
          </ConfigRow>
        </div>
        <ConfigRow label="Decimal places">
          <Select
            value={field.config.decimals}
            onChange={(e) => set({ decimals: Number(e.target.value) as Decimals })}
          >
            {DECIMAL_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </ConfigRow>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ConfigRow label="Prefix">
            <TextInput
              value={field.config.prefix ?? ''}
              onChange={(e) => set({ prefix: e.target.value })}
              placeholder="$"
            />
          </ConfigRow>
          <ConfigRow label="Suffix">
            <TextInput
              value={field.config.suffix ?? ''}
              onChange={(e) => set({ suffix: e.target.value })}
              placeholder="kg"
            />
          </ConfigRow>
        </div>
      </>
    )
  },
  Renderer: ({ field, value, onChange, disabled }) => {
    const num = asNumber(value)
    return (
      <div className="flex items-stretch rounded-lg border border-line bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        {field.config.prefix ? (
          <span className="flex items-center border-r border-line bg-canvas px-3 text-sm text-muted">
            {field.config.prefix}
          </span>
        ) : null}
        <input
          type="number"
          className="w-full bg-transparent px-3 py-2 text-sm text-ink outline-none disabled:cursor-not-allowed"
          value={num === null ? '' : num}
          step={field.config.decimals > 0 ? 1 / 10 ** field.config.decimals : 1}
          min={field.config.min}
          max={field.config.max}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
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
    const num = asNumber(value)
    if (num === null) return 'Must be a valid number'
    const { min, max } = field.config
    if (min !== undefined && num < min) return `Must be at least ${min}`
    if (max !== undefined && num > max) return `Must be at most ${max}`
    return null
  },
  validateConfig: (field) => {
    const { min, max } = field.config
    return min !== undefined && max !== undefined && min > max
      ? ['Min value cannot exceed max value.']
      : []
  },
  toPdf: (field, value) => {
    const num = asNumber(value)
    if (num === null) return ''
    const formatted = formatNumber(num, field.config.decimals)
    return `${field.config.prefix ?? ''}${formatted}${field.config.suffix ?? ''}`
  },
  operators: [
    { value: 'equals', label: 'equals' },
    { value: 'gt', label: 'is greater than' },
    { value: 'lt', label: 'is less than' },
    { value: 'inRange', label: 'is within range' },
  ],
  evaluate: (operator, fieldValue, conditionValue) => {
    const num = asNumber(fieldValue)
    if (num === null) return false
    if (operator === 'inRange') {
      const range = conditionValue as RangeValue
      if (!range || typeof range !== 'object') return false
      return num >= range.min && num <= range.max
    }
    const target = Number(conditionValue)
    if (Number.isNaN(target)) return false
    switch (operator) {
      case 'equals':
        return num === target
      case 'gt':
        return num > target
      case 'lt':
        return num < target
      default:
        return false
    }
  },
})
