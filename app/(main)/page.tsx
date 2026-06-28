import { ClientOnly } from '@/components/ClientOnly'
import { TemplatesListPage } from '@/views/TemplatesListPage'

export default function HomePage() {
  return (
    <ClientOnly>
      <TemplatesListPage />
    </ClientOnly>
  )
}
