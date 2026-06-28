import { useDraggable } from '@dnd-kit/core'
import { getFieldDefinitionsByCategory } from '../fields/registry'
import type { FieldType } from '../fields/types'

interface FieldPaletteProps {
  onAdd: (type: FieldType) => void
}

function PaletteItem({
  type,
  label,
  description,
  icon,
  onAdd,
}: {
  type: FieldType
  label: string
  description: string
  icon: React.ReactNode
  onAdd: (type: FieldType) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { paletteType: type },
  })
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onAdd(type)}
      className={`flex w-full items-start gap-3 rounded-lg border border-line bg-white p-3 text-left transition hover:border-brand/50 hover:bg-brand-soft/40 ${
        isDragging ? 'opacity-50' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <span className="mt-0.5 text-brand">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block truncate text-xs text-muted">{description}</span>
      </span>
    </button>
  )
}

export function FieldPalette({ onAdd }: FieldPaletteProps) {
  return (
    <div className="space-y-5">
      {getFieldDefinitionsByCategory().map((group) => (
        <section key={group.key} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            {group.label}
          </h2>
          {group.definitions.map((definition) => (
            <PaletteItem
              key={definition.type}
              type={definition.type}
              label={definition.paletteLabel}
              description={definition.paletteDescription}
              icon={definition.icon}
              onAdd={onAdd}
            />
          ))}
        </section>
      ))}
    </div>
  )
}
