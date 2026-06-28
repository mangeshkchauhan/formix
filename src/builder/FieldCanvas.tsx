import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  type SortingStrategy,
} from '@dnd-kit/sortable'
import { Fragment, useMemo } from 'react'
import { fieldRegistry } from '../fields/registry'
import { createId } from '../lib/id'
import type { AnyField, FieldType } from '../fields/types'
import { DropPreview } from './DragPreview'
import { SortableFieldRow } from './SortableFieldRow'

interface FieldCanvasProps {
  fields: AnyField[]
  selectedId: string | null
  /** Field type being dragged from the palette, if any. */
  palettePreviewType: FieldType | null
  /** Index where a new palette field would land (fields.length === end). */
  insertIndex: number | null
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onMove: (id: string, direction: -1 | 1) => void
}

// Existing fields reorder with the live "make room" animation. A palette drag has
// no sortable active item (activeIndex < 0), so we keep the rows still and show a
// ghost preview instead.
const sortingStrategy: SortingStrategy = (args) =>
  args.activeIndex < 0 ? null : verticalListSortingStrategy(args)

export function FieldCanvas({
  fields,
  selectedId,
  palettePreviewType,
  insertIndex,
  onSelect,
  onRemove,
  onMove,
}: FieldCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas' })

  const previewField = useMemo<AnyField | null>(
    () =>
      palettePreviewType
        ? fieldRegistry[palettePreviewType].createDefault(createId('preview'))
        : null,
    [palettePreviewType],
  )

  const showGhost = previewField !== null && insertIndex !== null

  if (fields.length === 0) {
    return (
      <div
        ref={setNodeRef}
        data-field-canvas
        className={`flex min-h-72 flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition ${
          isOver ? 'border-brand bg-brand-soft/40' : 'border-line bg-white'
        }`}
      >
        {previewField ? (
          <div className="w-full max-w-md px-6">
            <DropPreview field={previewField} />
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-ink">Your form is empty</p>
            <p className="mt-1 text-sm text-muted">
              Click or drag a field type from the left to get started.
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div ref={setNodeRef} data-field-canvas className="flex-1 rounded-2xl pt-1.5">
      <SortableContext items={fields.map((f) => f.id)} strategy={sortingStrategy}>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <Fragment key={field.id}>
              {showGhost && insertIndex === index && previewField ? (
                <DropPreview field={previewField} />
              ) : null}
              <SortableFieldRow
                field={field}
                selected={selectedId === field.id}
                isFirst={index === 0}
                isLast={index === fields.length - 1}
                onSelect={onSelect}
                onRemove={onRemove}
                onMove={onMove}
              />
            </Fragment>
          ))}
          {showGhost && insertIndex === fields.length && previewField ? (
            <DropPreview field={previewField} />
          ) : null}
        </div>
      </SortableContext>
    </div>
  )
}
