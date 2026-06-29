import { Suspense } from 'react'
import { ClientOnly } from '@/components/ClientOnly'
import { BuilderPage } from '@/views/BuilderPage'

export default async function BuilderRoute({
  params,
}: {
  params: Promise<{ templateId: string }>
}) {
  const { templateId } = await params
  return (
    <ClientOnly>
      <Suspense fallback={null}>
        <BuilderPage key={templateId} />
      </Suspense>
    </ClientOnly>
  )
}
