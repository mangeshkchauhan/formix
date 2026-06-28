import { ClientOnly } from '@/components/ClientOnly'
import { BuilderPage } from '@/views/BuilderPage'

export default function BuilderRoute() {
  return (
    <ClientOnly>
      <BuilderPage />
    </ClientOnly>
  )
}
