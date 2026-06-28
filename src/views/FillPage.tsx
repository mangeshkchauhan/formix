'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '../components/ui'
import { Logo } from '../components/Logo'
import { Modal } from '../components/Modal'
import { IconChevronLeft, IconDownload, IconEye } from '../components/icons'
import type { FieldValue, FormInstance } from '../fields/types'
import { FormRenderer } from '../fill/FormRenderer'
import { ResponseView } from '../fill/ResponseView'
import { printInstance } from '../pdf/printInstance'
import { useInstancesStore } from '../store/instances'
import { useTemplatesStore } from '../store/templates'

export function FillPage() {
  const params = useParams<{ templateId: string }>()
  const templateId = params.templateId ?? ''
  const router = useRouter()
  const template = useTemplatesStore((s) => s.getTemplate(templateId))
  const addInstance = useInstancesStore((s) => s.addInstance)

  const [submitted, setSubmitted] = useState<FormInstance | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    if (!template) router.replace('/')
  }, [template, router])

  if (!template) return null

  const handleSubmit = (values: Record<string, FieldValue>) => {
    const instance = addInstance(templateId, values)
    setSubmitted(instance)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="flex items-center gap-3 border-b border-line bg-white px-6 py-3">
        <Link
          href="/"
          className="flex items-center text-sm font-medium text-muted hover:text-ink"
        >
          <IconChevronLeft />
        </Link>
        <Logo />
      </header>

      <div className="mx-auto max-w-2xl px-6 py-10">
        {submitted ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
            <h1 className="text-lg font-semibold text-ink">Response submitted</h1>
            <p className="mt-1 text-sm text-muted">
              Your response to "{template.title}" has been saved.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button variant="secondary" onClick={() => setViewOpen(true)}>
                <IconEye /> View response
              </Button>
              <Button
                variant="primary"
                onClick={() => printInstance(template, submitted)}
              >
                <IconDownload /> Download PDF
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSubmitted(null)
                  setFormKey((k) => k + 1)
                }}
              >
                New Response
              </Button>
              <Link href={`/templates/${templateId}/instances`}>
                <Button variant="ghost">All Responses</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-white p-6">
            <h1 className="text-xl font-bold text-ink">{template.title}</h1>
            <p className="mb-6 mt-1 text-sm text-muted">
              Fill in the form below and submit your response.
            </p>
            <FormRenderer key={formKey} template={template} onSubmit={handleSubmit} />
          </div>
        )}
      </div>

      <Modal open={viewOpen} title="Response details" onClose={() => setViewOpen(false)}>
        {submitted ? <ResponseView template={template} instance={submitted} /> : null}
      </Modal>
    </div>
  )
}
