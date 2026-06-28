import { IconCalc } from '../../components/icons'
import { ConfigRow, Select } from '../../components/ui'
import { formatNumber } from '../../lib/format'
import { defineField } from '../contract'
import type { Aggregation, CalculationField, Decimals } from '../types'
import { asNumber } from '../value'

const DECIMAL_OPTIONS: Decimals[] = [0, 1, 2, 3, 4]
const AGGREGATIONS: { value: Aggregation; label: string }[] = [
  { value: 'sum', label: 'Sum' },
  { value: 'average', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
]

export const calculationDefinition = defineField<CalculationField>({
  type: 'calculation',
  paletteLabel: 'Calculation',
  paletteDescription: 'Auto-computed from Number fields',
  category: 'advanced',
  icon: <IconCalc />,
  isInput: true,
  createDefault: (id) => ({
    id,
    type: 'calculation',
    label: 'Untitled calculation',
    defaultVisible: true,
    defaultRequired: false,
    conditions: [],
    config: { sourceFieldIds: [], aggregation: 'sum', decimals: 0 },
  }),
  getEmptyValue: () => null,
  ConfigPanel: ({ field, onChange, allFields }) => {
    const set = (patch: Partial<CalculationField['config']>) =>
      onChange({ ...field, config: { ...field.config, ...patch } })
    // A calculation may only source Number fields (never another calculation).
    const numberFields = allFields.filter((f) => f.type === 'number')
    const toggleSource = (id: string) => {
      const current = field.config.sourceFieldIds
      set({
        sourceFieldIds: current.includes(id)
          ? current.filter((s) => s !== id)
          : [...current, id],
      })
    }
    return (
      <>
        <ConfigRow label="Aggregation">
          <Select
            value={field.config.aggregation}
            onChange={(e) => set({ aggregation: e.target.value as Aggregation })}
          >
            {AGGREGATIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </Select>
        </ConfigRow>
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
        <ConfigRow label="Source fields" hint="Only Number fields can be sources.">
          {numberFields.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line bg-canvas px-3 py-2 text-xs text-muted">
              Add a Number field to use as a source.
            </p>
          ) : (
            <div className="space-y-2">
              {numberFields.map((f) => (
                <label
                  key={f.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
                >
                  <input
                    type="checkbox"
                    checked={field.config.sourceFieldIds.includes(f.id)}
                    onChange={() => toggleSource(f.id)}
                    className="accent-brand"
                  />
                  {f.label || 'Untitled number field'}
                </label>
              ))}
            </div>
          )}
        </ConfigRow>
      </>
    )
  },
  Renderer: ({ field, value }) => {
    const num = asNumber(value)
    return (
      <div className="flex items-center justify-between rounded-lg border border-line bg-canvas px-3 py-2 text-sm">
        <span className="font-semibold text-ink">
          {num === null ? '—' : formatNumber(num, field.config.decimals)}
        </span>
        <span className="text-xs uppercase tracking-wide text-muted">
          {field.config.aggregation}
        </span>
      </div>
    )
  },
  validate: () => null,
  validateConfig: (field, allFields) => {
    const numberIds = new Set(
      allFields.filter((f) => f.type === 'number').map((f) => f.id),
    )
    const validSources = field.config.sourceFieldIds.filter((id) =>
      numberIds.has(id),
    )
    return validSources.length === 0
      ? ['Select at least one Number field as a source.']
      : []
  },
  toPdf: (field, value) => {
    const num = asNumber(value)
    return num === null ? '' : formatNumber(num, field.config.decimals)
  },
})
