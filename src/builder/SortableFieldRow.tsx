import { memo, type MouseEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { AnyField } from '../fields/types'
import {
  IconArrowDown,
  IconArrowUp,
  IconGrip,
  IconTrash,
} from '../components/icons'
import { FieldPreview } from './FieldPreview'

interface SortableFieldRowProps {
  field: AnyField
  selected: boolean
  isFirst: boolean
  isLast: boolean
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onMove: (id: string, direction: -1 | 1) => void
}

function FieldRowComponent({
  field,
  selected,
  isFirst,
  isLast,
  onSelect,
  onRemove,
  onMove,
}: SortableFieldRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const stop = (e: MouseEvent) => e.stopPropagation()

  return (
    <div
      ref={setNodeRef}
      data-builder-field-id={field.id}
      onClick={() => onSelect(field.id)}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative cursor-pointer rounded-lg border bg-white py-2.5 pl-8 pr-3 ${
        selected ? 'border-brand ring-2 ring-brand/20' : 'border-line hover:border-brand/40'
      } ${isDragging ? 'opacity-0' : ''}`}
    >
      <button
        type="button"
        aria-label="Drag to reorder field"
        className="absolute left-0.5 top-1/2 -translate-y-1/2 cursor-grab touch-none rounded p-1 text-muted opacity-40 transition hover:bg-canvas hover:text-ink group-hover:opacity-100"
        {...attributes}
        {...listeners}
      >
        <IconGrip />
      </button>

      <div className="pointer-events-none select-none">
        <FieldPreview field={field} />
      </div>

      <div
        className="absolute right-2 top-2 flex items-center gap-0.5 rounded-lg border border-line bg-white opacity-0 shadow-sm transition focus-within:opacity-100 group-hover:opacity-100"
        onClick={stop}
      >
        <button
          type="button"
          onClick={() => onMove(field.id, -1)}
          disabled={isFirst}
          aria-label="Move field up"
          className="rounded p-1 text-muted hover:bg-canvas hover:text-ink disabled:opacity-30"
        >
          <IconArrowUp />
        </button>
        <button
          type="button"
          onClick={() => onMove(field.id, 1)}
          disabled={isLast}
          aria-label="Move field down"
          className="rounded p-1 text-muted hover:bg-canvas hover:text-ink disabled:opacity-30"
        >
          <IconArrowDown />
        </button>
        <button
          type="button"
          onClick={() => onRemove(field.id)}
          aria-label="Delete field"
          className="rounded p-1 text-muted hover:bg-red-50 hover:text-red-600"
        >
          <IconTrash />
        </button>
      </div>
    </div>
  )
}

export const SortableFieldRow = memo(FieldRowComponent)
