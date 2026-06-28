'use client'

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'

import { useCallback, useMemo, useState, type MouseEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fieldRegistry } from '../fields/registry'
import type {
  AnyField,
  FieldType,
  FieldValue,
  FormTemplate,
} from '../fields/types'
import { createId } from '../lib/id'
import { useInstancesStore } from '../store/instances'
import { useTemplatesStore } from '../store/templates'
import {
  collectConfigErrors,
  hasConfigErrors,
  type ConfigErrors,
} from '../logic/configValidation'
import { Button, TextInput } from '../components/ui'
import { Logo } from '../components/Logo'
import { Modal } from '../components/Modal'
import { IconChevronLeft, IconPlus } from '../components/icons'
import { FormRenderer } from '../fill/FormRenderer'
import { ResponsesPanel } from '../fill/ResponsesPanel'
import { ConfigPanel } from './ConfigPanel'
import { FieldCanvas } from './FieldCanvas'
import { FieldPalette } from './FieldPalette'
import { FieldRowPreview, PalettePreview } from './DragPreview'

type Tab = 'build' | 'preview' | 'responses'
type ActiveDrag =
  | { kind: 'field'; id: string }
  | { kind: 'palette'; type: FieldType }
  | null
type MobilePanel = 'palette' | 'config' | null

interface BuilderEditorProps {
  initialTemplate: FormTemplate
}

export function BuilderEditor({ initialTemplate }: BuilderEditorProps) {
  const router = useRouter()
  const addTemplate = useTemplatesStore((s) => s.addTemplate)
  const updateTemplateFields = useTemplatesStore((s) => s.updateTemplateFields)
  const addInstance = useInstancesStore((s) => s.addInstance)
  const instanceCount = useInstancesStore(
    (s) => s.instances.filter((i) => i.templateId === initialTemplate.id).length,
  )

  const [title, setTitle] = useState(initialTemplate.title)
  const [fields, setFields] = useState<AnyField[]>(initialTemplate.fields)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('build')
  const [dirty, setDirty] = useState(false)
  const [configErrors, setConfigErrors] = useState<ConfigErrors>({})
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null)
  const [insertIndex, setInsertIndex] = useState<number | null>(null)
  const [previewKey, setPreviewKey] = useState(0)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Prefer the field rows over the wrapping "canvas" droppable so reordering snaps to
  // the nearest row (canvas only wins when the list is empty).
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const hits = closestCenter(args)
    const rows = hits.filter((h) => h.id !== 'canvas')
    return rows.length ? rows : hits
  }, [])

  const markDirty = useCallback(() => setDirty(true), [])

  const selectedField = useMemo(
    () => fields.find((f) => f.id === selectedId) ?? null,
    [fields, selectedId],
  )

  const currentTemplate: FormTemplate = useMemo(
    () => ({
      ...initialTemplate,
      title: title.trim() || 'Untitled form',
      fields,
    }),
    [initialTemplate, title, fields],
  )

  const addField = useCallback(
    (type: FieldType, atIndex?: number) => {
      const field = fieldRegistry[type].createDefault(createId('fld'))
      setFields((prev) => {
        if (atIndex === undefined || atIndex >= prev.length) return [...prev, field]
        const next = [...prev]
        next.splice(Math.max(0, atIndex), 0, field)
        return next
      })
      setSelectedId(field.id)
      markDirty()
    },
    [markDirty],
  )

  const updateField = useCallback(
    (updated: AnyField) => {
      setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
      setConfigErrors((prev) => {
        if (!prev[updated.id]) return prev
        const next = { ...prev }
        delete next[updated.id]
        return next
      })
      markDirty()
    },
    [markDirty],
  )

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  const handleRemove = useCallback(
    (id: string) => {
      setFields((prev) => prev.filter((f) => f.id !== id))
      setSelectedId((current) => (current === id ? null : current))
      markDirty()
    },
    [markDirty],
  )

  const handleMove = useCallback(
    (id: string, direction: -1 | 1) => {
      setFields((prev) => {
        const index = prev.findIndex((f) => f.id === id)
        const target = index + direction
        if (index < 0 || target < 0 || target >= prev.length) return prev
        return arrayMove(prev, index, target)
      })
      markDirty()
    },
    [markDirty],
  )

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id)
    if (id.startsWith('palette:')) {
      const type = event.active.data.current?.paletteType as FieldType | undefined
      if (type) setActiveDrag({ kind: 'palette', type })
    } else {
      setActiveDrag({ kind: 'field', id })
    }
  }

  // For a NEW field from the palette there is no sortable item to shuffle, so the
  // drop slot (0..fields.length) is resolved from the pointer's Y against each row's
  // vertical midpoint, read live from the DOM. Returns null when outside the canvas.
  const resolvePaletteInsertIndex = (event: DragMoveEvent): number | null => {
    const activator = event.activatorEvent as PointerEvent | null
    if (!activator || typeof activator.clientY !== 'number') return null
    const pointerX = activator.clientX + event.delta.x
    const pointerY = activator.clientY + event.delta.y

    const canvas = document.querySelector<HTMLElement>('[data-field-canvas]')
    if (!canvas) return 0
    const c = canvas.getBoundingClientRect()
    const inside =
      pointerX >= c.left &&
      pointerX <= c.right &&
      pointerY >= c.top - 12 &&
      pointerY <= c.bottom + 12
    if (!inside) return null

    const rows = Array.from(
      document.querySelectorAll<HTMLElement>('[data-builder-field-id]'),
    )
    if (rows.length === 0) return 0
    for (let i = 0; i < rows.length; i += 1) {
      const rect = rows[i].getBoundingClientRect()
      if (pointerY < rect.top + rect.height / 2) return i
    }
    return rows.length
  }

  // Reordering is handled by the sortable shuffle; only the palette ghost needs a
  // computed slot, updated on every pointer move.
  const handleDragMove = (event: DragMoveEvent) => {
    if (activeDrag?.kind !== 'palette') return
    setInsertIndex(resolvePaletteInsertIndex(event))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const activeId = String(active.id)

    if (activeId.startsWith('palette:')) {
      const type = active.data.current?.paletteType as FieldType | undefined
      if (type && insertIndex !== null) addField(type, insertIndex)
    } else if (over) {
      const oldIndex = fields.findIndex((f) => f.id === activeId)
      // Dropping over the canvas fallback (only when the list is empty/below all
      // rows) moves to the end; otherwise snap to the row under the pointer.
      const newIndex =
        over.id === 'canvas'
          ? fields.length - 1
          : fields.findIndex((f) => f.id === over.id)
      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        setFields((prev) => arrayMove(prev, oldIndex, newIndex))
        markDirty()
      }
    }

    setActiveDrag(null)
    setInsertIndex(null)
  }

  const handleDragCancel = () => {
    setActiveDrag(null)
    setInsertIndex(null)
  }

  // Returns true when the template was saved, false when blocked by invalid config.
  const persist = useCallback((): boolean => {
    const errors = collectConfigErrors(fields)
    if (hasConfigErrors(errors)) {
      setConfigErrors(errors)
      const firstInvalid = fields.find((f) => errors[f.id])
      if (firstInvalid) setSelectedId(firstInvalid.id)
      setTab('build')
      return false
    }
    setConfigErrors({})

    const cleanTitle = title.trim() || 'Untitled form'
    const exists = useTemplatesStore.getState().getTemplate(initialTemplate.id)
    if (exists) {
      updateTemplateFields(initialTemplate.id, fields, cleanTitle)
    } else {
      addTemplate({ ...initialTemplate, title: cleanTitle, fields })
      router.replace(`/builder/${initialTemplate.id}`)
    }
    setDirty(false)
    return true
  }, [title, fields, initialTemplate, updateTemplateFields, addTemplate, router])

  const handlePreviewSubmit = (values: Record<string, FieldValue>) => {
    if (!persist()) return
    addInstance(initialTemplate.id, values)
    setTab('responses')
  }

  const goTab = (next: Tab) => {
    if (next === 'preview') setPreviewKey((k) => k + 1)
    setTab(next)
  }

  const handleLeave = (e: MouseEvent) => {
    if (dirty && !window.confirm('You have unsaved changes. Leave without saving?')) {
      e.preventDefault()
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="shrink-0 border-b border-line bg-white">
        <div className="flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
          <Link
            href="/"
            onClick={handleLeave}
            className="flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
          >
            <IconChevronLeft />
          </Link>
          <Logo compact />
          <div className="ml-auto flex items-center gap-2">
            {dirty ? (
              <span className="hidden text-xs font-medium text-amber-600 sm:inline">
                Unsaved changes
              </span>
            ) : (
              <span className="hidden text-xs text-muted sm:inline">Saved</span>
            )}
            <Button variant="primary" onClick={persist} disabled={!dirty}>
              Save
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-3 pb-2.5 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:pb-3">
          <TextInput
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              markDirty()
            }}
            placeholder="Form title"
            className="w-full min-w-0 font-semibold sm:max-w-xs"
          />

          <div className="mx-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-canvas p-1">
            {(['build', 'preview', 'responses'] as Tab[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => goTab(value)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition active:scale-[0.97] sm:px-4 ${
                  tab === value
                    ? 'bg-white text-ink shadow-sm'
                    : 'text-muted hover:bg-white/60 hover:text-ink'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </header>

      {tab === 'build' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[260px_1fr_340px]">
            <aside className="hidden overflow-y-auto border-r border-line bg-white p-4 lg:block">
              <FieldPalette onAdd={(type) => addField(type)} />
            </aside>

            <main className="flex-1 overflow-y-auto bg-canvas p-4 sm:p-6">
              <div className="mx-auto flex min-h-full max-w-2xl flex-col">
                {instanceCount > 0 ? (
                  <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    This template has {instanceCount} saved response
                    {instanceCount === 1 ? '' : 's'}. Editing or removing fields may
                    leave past responses showing stale or missing values.
                  </p>
                ) : null}
                {hasConfigErrors(configErrors) ? (
                  <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                    Some fields have configuration problems. Fix the highlighted
                    fields, then save again.
                  </p>
                ) : null}
                <FieldCanvas
                  fields={fields}
                  selectedId={selectedId}
                  palettePreviewType={
                    activeDrag?.kind === 'palette' ? activeDrag.type : null
                  }
                  insertIndex={insertIndex}
                  onSelect={handleSelect}
                  onRemove={handleRemove}
                  onMove={handleMove}
                />
              </div>
            </main>

            <aside className="hidden overflow-y-auto border-l border-line bg-white lg:block">
              <ConfigPanel
                field={selectedField}
                allFields={fields}
                onChange={updateField}
                errors={selectedField ? configErrors[selectedField.id] : undefined}
              />
            </aside>

            <div className="flex shrink-0 items-center gap-2 border-t border-line bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setMobilePanel('palette')}
              >
                <IconPlus /> Add field
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                disabled={!selectedField}
                onClick={() => setMobilePanel('config')}
              >
                Configure
              </Button>
            </div>
          </div>

          <Modal
            open={mobilePanel === 'palette'}
            title="Add field"
            onClose={() => setMobilePanel(null)}
          >
            <FieldPalette
              onAdd={(type) => {
                addField(type)
                setMobilePanel(null)
              }}
            />
          </Modal>

          <Modal
            open={mobilePanel === 'config'}
            title="Field settings"
            onClose={() => setMobilePanel(null)}
          >
            <ConfigPanel
              field={selectedField}
              allFields={fields}
              onChange={updateField}
              errors={selectedField ? configErrors[selectedField.id] : undefined}
            />
          </Modal>

          <DragOverlay dropAnimation={{ duration: 180 }}>
            {activeDrag?.kind === 'field' ? (
              <FieldRowPreview
                field={fields.find((f) => f.id === activeDrag.id) ?? fields[0]}
              />
            ) : activeDrag?.kind === 'palette' ? (
              <PalettePreview type={activeDrag.type} />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : null}

      {tab === 'preview' ? (
        <div className="flex-1 overflow-y-auto bg-canvas p-4 sm:p-8">
          <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-white p-4 sm:p-6">
            <h1 className="text-xl font-bold text-ink">{currentTemplate.title}</h1>
            <p className="mb-6 mt-1 text-sm text-muted">
              Fill in the form to test it. Submitting saves the template and adds a
              response.
            </p>
            <FormRenderer
              key={previewKey}
              template={currentTemplate}
              onSubmit={handlePreviewSubmit}
              submitLabel="Submit response"
            />
          </div>
        </div>
      ) : null}

      {tab === 'responses' ? (
        <div className="flex-1 overflow-y-auto bg-canvas p-4 sm:p-8">
          <div className="mx-auto max-w-2xl">
            {dirty ? (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                You have unsaved changes. New responses use the last saved version
                until you save.
              </p>
            ) : null}
            <ResponsesPanel template={currentTemplate} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
