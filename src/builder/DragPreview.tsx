import { useMemo } from 'react'
import { fieldRegistry } from '../fields/registry'
import type { AnyField, FieldType } from '../fields/types'
import { createId } from '../lib/id'
import { FieldPreview } from './FieldPreview'

/** Floating preview shown in the DragOverlay while reordering an existing field. */
export function FieldRowPreview({ field }: { field: AnyField }) {
  return (
    <div className="w-xl max-w-[80vw] rounded-lg border border-brand bg-white py-2.5 pl-8 pr-3 shadow-xl ring-2 ring-brand/20">
      <div className="pointer-events-none select-none">
        <FieldPreview field={field} />
      </div>
    </div>
  )
}

/** Floating preview shown in the DragOverlay while dragging a new field type. */
export function PalettePreview({ type }: { type: FieldType }) {
  const field = useMemo(
    () => fieldRegistry[type].createDefault(createId('preview')),
    [type],
  )
  return <FieldRowPreview field={field} />
}

/**
 * Ghost shown at the insertion point — the field's actual view (dashed) so the
 * user sees the real component landing in place, for both palette and reorder.
 */
export function DropPreview({ field }: { field: AnyField }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-brand bg-brand-soft/25 py-2.5 pl-8 pr-3">
      <div className="pointer-events-none select-none opacity-80">
        <FieldPreview field={field} />
      </div>
    </div>
  )
}
