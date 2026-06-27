import { IconDate } from '../../components/icons'
import { ConfigRow, TextInput, Toggle } from '../../components/ui'
import { formatDate } from '../../lib/format'
import { defineField } from '../contract'
import type { DateField } from '../types'
import { asString, isEmptyValue } from '../value'

export const dateDefinition = defineField<DateField>({
  type: 'date',
  paletteLabel: 'Date',
  paletteDescription: 'A date picker',
  category: 'numberDate',
  icon: <IconDate />,
  isInput: true,
  createDefault: (id) => ({
    id,
    type: 'date',
    label: 'Untitled date field',
    defaultVisible: true,
    defaultRequired: false,
    conditions: [],
    config: { prefillToday: false },
  }),
  getEmptyValue: () => '',
  ConfigPanel: ({ field, onChange }) => {
    const set = (patch: Partial<DateField['config']>) =>
      onChange({ ...field, config: { ...field.config, ...patch } })
    return (
      <>
        <ConfigRow label="Pre-fill" hint="Sets today's date when a new response is opened.">
          <Toggle
            label="Pre-fill with today's date"
            checked={field.config.prefillToday}
            onChange={(checked) => set({ prefillToday: checked })}
          />
        </ConfigRow>
        <div className="grid grid-cols-2 gap-3">
          <ConfigRow label="Min date">
            <TextInput
              type="date"
              value={field.config.minDate ?? ''}
              onChange={(e) => set({ minDate: e.target.value || undefined })}
            />
          </ConfigRow>
          <ConfigRow label="Max date">
            <TextInput
              type="date"
              value={field.config.maxDate ?? ''}
              onChange={(e) => set({ maxDate: e.target.value || undefined })}
            />
          </ConfigRow>
        </div>
      </>
    )
  },
  Renderer: ({ field, value, onChange, disabled }) => (
    <TextInput
      type="date"
      value={asString(value)}
      min={field.config.minDate}
      max={field.config.maxDate}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  validate: (field, value) => {
    if (isEmptyValue(value)) return null
    const date = asString(value)
    const { minDate, maxDate } = field.config
    if (minDate && date < minDate) return `Must be on or after ${formatDate(minDate)}`
    if (maxDate && date > maxDate) return `Must be on or before ${formatDate(maxDate)}`
    return null
  },
  validateConfig: (field) => {
    const { minDate, maxDate } = field.config
    return minDate && maxDate && minDate > maxDate
      ? ['Min date cannot be after max date.']
      : []
  },
  toPdf: (_field, value) => formatDate(asString(value)),
  operators: [
    { value: 'equals', label: 'equals' },
    { value: 'before', label: 'is before' },
    { value: 'after', label: 'is after' },
  ],
  evaluate: (operator, fieldValue, conditionValue) => {
    const a = asString(fieldValue)
    const b = String(conditionValue ?? '')
    if (!a || !b) return false
    switch (operator) {
      case 'equals':
        return a === b
      case 'before':
        return a < b
      case 'after':
        return a > b
      default:
        return false
    }
  },
})
