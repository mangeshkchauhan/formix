import { useMemo, useState } from 'react'
import { Button } from '../components/ui'
import { Modal } from '../components/Modal'
import { IconDownload, IconEye, IconTrash } from '../components/icons'
import type { FormInstance, FormTemplate } from '../fields/types'
import { formatDateTime } from '../lib/format'
import { printInstance } from '../pdf/printInstance'
import { useInstancesStore } from '../store/instances'
import { ResponseView } from './ResponseView'

interface ResponsesPanelProps {
  template: FormTemplate
}

export function ResponsesPanel({ template }: ResponsesPanelProps) {
  const instances = useInstancesStore((s) => s.instances)
  const deleteInstance = useInstancesStore((s) => s.deleteInstance)
  const [viewing, setViewing] = useState<FormInstance | null>(null)

  const rows = useMemo(
    () =>
      instances
        .filter((i) => i.templateId === template.id)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [instances, template.id],
  )

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-line bg-white py-16 text-center">
        <p className="text-sm font-medium text-ink">No responses yet</p>
        <p className="mt-1 text-sm text-muted">
          Submitted responses will appear here.
        </p>
      </div>
    )
  }

  return (
    <>
      <ul className="space-y-2">
        {rows.map((instance, index) => (
          <li
            key={instance.id}
            className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3"
          >
            <button
              type="button"
              onClick={() => setViewing(instance)}
              className="text-left transition hover:text-brand"
            >
              <p className="text-sm font-medium text-ink">
                Response #{rows.length - index}
              </p>
              <p className="text-xs text-muted">
                {formatDateTime(instance.submittedAt)}
              </p>
            </button>
            <div className="flex items-center gap-1.5">
              <Button variant="secondary" onClick={() => setViewing(instance)}>
                <IconEye /> View
              </Button>
              <Button
                variant="secondary"
                aria-label="Download PDF"
                onClick={() => printInstance(template, instance)}
              >
                <IconDownload />
              </Button>
              <Button
                variant="ghost"
                aria-label="Delete response"
                onClick={() => {
                  if (window.confirm('Delete this response?')) {
                    deleteInstance(instance.id)
                    setViewing((current) =>
                      current?.id === instance.id ? null : current,
                    )
                  }
                }}
              >
                <IconTrash />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={viewing !== null}
        title="Response details"
        onClose={() => setViewing(null)}
      >
        {viewing ? (
          <>
            <ResponseView template={template} instance={viewing} />
            <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">
              <Button
                variant="secondary"
                onClick={() => printInstance(template, viewing)}
              >
                <IconDownload /> Download PDF
              </Button>
            </div>
          </>
        ) : null}
      </Modal>
    </>
  )
}
