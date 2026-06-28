'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, TextInput } from '../components/ui'
import {
  IconEye,
  IconPlus,
  IconSearch,
  IconStar,
  IconStarFilled,
  IconTrash,
} from '../components/icons'
import { formatDateTime } from '../lib/format'
import type { FormTemplate } from '../fields/types'
import { useInstancesStore } from '../store/instances'
import { useTemplatesStore } from '../store/templates'

interface TemplatesListPageProps {
  favouritesOnly?: boolean
}

export function TemplatesListPage({ favouritesOnly }: TemplatesListPageProps) {
  const router = useRouter()
  const templates = useTemplatesStore((s) => s.templates)
  const deleteTemplate = useTemplatesStore((s) => s.deleteTemplate)
  const toggleFavorite = useTemplatesStore((s) => s.toggleFavorite)
  const instances = useInstancesStore((s) => s.instances)
  const deleteInstancesForTemplate = useInstancesStore(
    (s) => s.deleteInstancesForTemplate,
  )
  const [query, setQuery] = useState('')

  const countFor = (templateId: string) =>
    instances.filter((i) => i.templateId === templateId).length

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}" and all its responses?`)) return
    deleteTemplate(id)
    deleteInstancesForTemplate(id)
  }

  const visible = useMemo(() => {
    return templates
      .filter((t) => (favouritesOnly ? t.favorite : true))
      .filter((t) => t.title.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [templates, favouritesOnly, query])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink sm:text-2xl">
            {favouritesOnly ? 'Favourite Templates' : 'All Templates'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {favouritesOnly
              ? 'Templates you have starred for quick access.'
              : 'Design form templates and collect responses.'}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-auto">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <IconSearch />
            </span>
            <TextInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates"
              className="w-full pl-9 sm:w-56"
            />
          </div>
          <Button variant="primary" onClick={() => router.push('/builder/new')}>
            <IconPlus /> New Template
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          favouritesOnly={favouritesOnly}
          hasQuery={query.trim().length > 0}
          onNew={() => router.push('/builder/new')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              responseCount={countFor(template.id)}
              onOpen={() => router.push(`/builder/${template.id}`)}
              onNewResponse={() => router.push(`/fill/${template.id}`)}
              onViewResponses={() =>
                router.push(`/templates/${template.id}/instances`)
              }
              onToggleFavorite={() => toggleFavorite(template.id)}
              onDelete={() => handleDelete(template.id, template.title)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface TemplateCardProps {
  template: FormTemplate
  responseCount: number
  onOpen: () => void
  onNewResponse: () => void
  onViewResponses: () => void
  onToggleFavorite: () => void
  onDelete: () => void
}

function TemplateCard({
  template,
  responseCount,
  onOpen,
  onNewResponse,
  onViewResponses,
  onToggleFavorite,
  onDelete,
}: TemplateCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-white p-5 transition hover:border-brand/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 text-left transition hover:text-brand"
        >
          <h2 className="truncate text-lg font-semibold text-ink">
            {template.title}
          </h2>
        </button>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={template.favorite ? 'Unfavourite' : 'Favourite'}
          className={`shrink-0 rounded-lg p-1.5 transition active:scale-90 ${
            template.favorite
              ? 'text-amber-400 hover:bg-amber-50'
              : 'text-muted hover:bg-canvas hover:text-amber-400'
          }`}
        >
          {template.favorite ? <IconStarFilled /> : <IconStar />}
        </button>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-4 text-left transition hover:opacity-80"
      >
        <div className="flex gap-6">
          <Stat label="Fields" value={template.fields.length} />
          <Stat label="Responses" value={responseCount} />
        </div>
        <p className="mt-3 text-xs text-muted">
          Modified {formatDateTime(template.updatedAt)}
        </p>
      </button>

      <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
        <Button variant="primary" className="flex-1" onClick={onNewResponse}>
          New Response
        </Button>
        <Button variant="secondary" aria-label="View responses" onClick={onViewResponses}>
          <IconEye />
        </Button>
        <Button variant="ghost" aria-label="Delete template" onClick={onDelete}>
          <IconTrash />
        </Button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-bold text-ink">{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
    </div>
  )
}

function EmptyState({
  favouritesOnly,
  hasQuery,
  onNew,
}: {
  favouritesOnly?: boolean
  hasQuery: boolean
  onNew: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-white py-20 text-center">
      <p className="text-sm font-medium text-ink">
        {hasQuery
          ? 'No templates match your search'
          : favouritesOnly
            ? 'No favourites yet'
            : 'No templates yet'}
      </p>
      <p className="mt-1 text-sm text-muted">
        {favouritesOnly
          ? 'Star a template to see it here.'
          : 'Create your first form template to get started.'}
      </p>
      {!favouritesOnly && !hasQuery ? (
        <Button variant="primary" onClick={onNew} className="mt-4">
          <IconPlus /> New Template
        </Button>
      ) : null}
    </div>
  )
}
