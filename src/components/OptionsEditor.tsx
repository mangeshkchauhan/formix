import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createId } from '../lib/id'
import type { Option } from '../fields/types'
import { Button, TextInput } from './ui'
import { IconGrip, IconPlus, IconTrash } from './icons'

interface OptionsEditorProps {
  options: Option[]
  onChange: (options: Option[]) => void
}

function SortableOption({
  option,
  onLabel,
  onRemove,
}: {
  option: Option
  onLabel: (label: string) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: option.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-1.5 ${isDragging ? 'opacity-60' : ''}`}
    >
      <button
        type="button"
        className="cursor-grab text-muted hover:text-ink"
        aria-label="Drag to reorder option"
        {...attributes}
        {...listeners}
      >
        <IconGrip />
      </button>
      <TextInput
        value={option.label}
        onChange={(e) => onLabel(e.target.value)}
        placeholder="Option label"
      />
      <Button variant="ghost" aria-label="Remove option" onClick={onRemove}>
        <IconTrash />
      </Button>
    </div>
  )
}

export function OptionsEditor({ options, onChange }: OptionsEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = options.findIndex((o) => o.id === active.id)
    const newIndex = options.findIndex((o) => o.id === over.id)
    onChange(arrayMove(options, oldIndex, newIndex))
  }

  const addOption = () =>
    onChange([...options, { id: createId('opt'), label: `Option ${options.length + 1}` }])

  const updateLabel = (id: string, label: string) =>
    onChange(options.map((o) => (o.id === id ? { ...o, label } : o)))

  const removeOption = (id: string) => onChange(options.filter((o) => o.id !== id))

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={options.map((o) => o.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {options.map((option) => (
              <SortableOption
                key={option.id}
                option={option}
                onLabel={(label) => updateLabel(option.id, label)}
                onRemove={() => removeOption(option.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button variant="secondary" onClick={addOption} className="w-full">
        <IconPlus /> Add option
      </Button>
    </div>
  )
}
