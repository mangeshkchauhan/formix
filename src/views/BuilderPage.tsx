'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BuilderEditor } from '../builder/BuilderEditor'
import { createDraftTemplate, useTemplatesStore } from '../store/templates'

export function BuilderPage() {
  const params = useParams<{ templateId: string }>()
  const templateId = params.templateId ?? ''
  const router = useRouter()
  const isNew = templateId === 'new'

  const existing = useTemplatesStore((s) =>
    isNew ? undefined : s.getTemplate(templateId),
  )
  // A draft is held in memory and only persisted on Save (no auto-save).
  const [draft, setDraft] = useState(() => createDraftTemplate())

  useEffect(() => {
    if (!isNew && !existing) router.replace('/')
  }, [isNew, existing, router])

  // Re-entering "New Template" after a previous draft was saved must start fresh.
  useEffect(() => {
    if (isNew && useTemplatesStore.getState().getTemplate(draft.id)) {
      setDraft(createDraftTemplate())
    }
  }, [isNew, draft.id])

  const template = isNew ? draft : existing
  if (!template) return null

  // Keyed by id so switching templates resets editor state cleanly.
  return <BuilderEditor key={template.id} initialTemplate={template} />
}
