'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '../components/ui'
import { ResponsesPanel } from '../fill/ResponsesPanel'
import { useInstancesStore } from '../store/instances'
import { useTemplatesStore } from '../store/templates'

export function InstancesPage() {
  const params = useParams<{ templateId: string }>()
  const templateId = params.templateId ?? ''
  const router = useRouter()
  const template = useTemplatesStore((s) => s.getTemplate(templateId))
  const count = useInstancesStore(
    (s) => s.instances.filter((i) => i.templateId === templateId).length,
  )

  useEffect(() => {
    if (!template) router.replace('/')
  }, [template, router])

  if (!template) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink sm:text-2xl">{template.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {count} response{count === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/builder/${templateId}`}>
            <Button variant="secondary">Edit form</Button>
          </Link>
          <Link href={`/fill/${templateId}`}>
            <Button variant="primary">New Response</Button>
          </Link>
        </div>
      </div>

      <ResponsesPanel template={template} />
    </div>
  )
}
