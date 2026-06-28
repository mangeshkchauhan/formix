import { IconHeader } from '../../components/icons'
import { ConfigRow, Select } from '../../components/ui'
import { defineField } from '../contract'
import type { HeaderSize, SectionHeaderField } from '../types'

const SIZE_OPTIONS: { value: HeaderSize; label: string }[] = [
  { value: 'xs', label: 'XS' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'XL' },
]

export const headerSizeClasses: Record<HeaderSize, string> = {
  xs: 'text-sm font-semibold text-muted uppercase tracking-wide',
  sm: 'text-base font-semibold text-ink',
  md: 'text-lg font-semibold text-ink',
  lg: 'text-xl font-bold text-ink',
  xl: 'text-2xl font-bold text-ink',
}

export const headerLevel: Record<HeaderSize, 2 | 3 | 4 | 5 | 6> = {
  xl: 2,
  lg: 3,
  md: 4,
  sm: 5,
  xs: 6,
}

export const sectionHeaderDefinition = defineField<SectionHeaderField>({
  type: 'sectionHeader',
  paletteLabel: 'Section Header',
  paletteDescription: 'A heading to group fields',
  category: 'layout',
  icon: <IconHeader />,
  isInput: false,
  createDefault: (id) => ({
    id,
    type: 'sectionHeader',
    label: 'Section heading',
    defaultVisible: true,
    defaultRequired: false,
    conditions: [],
    config: { size: 'md' },
  }),
  getEmptyValue: () => null,
  ConfigPanel: ({ field, onChange }) => (
    <ConfigRow label="Heading size">
      <Select
        value={field.config.size}
        onChange={(e) =>
          onChange({ ...field, config: { size: e.target.value as HeaderSize } })
        }
      >
        {SIZE_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
    </ConfigRow>
  ),
  Renderer: ({ field }) => {
    const Tag = `h${headerLevel[field.config.size]}` as const
    return <Tag className={headerSizeClasses[field.config.size]}>{field.label}</Tag>
  },
  validate: () => null,
  toPdf: () => '',
})
