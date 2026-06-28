import { ClientOnly } from '@/components/ClientOnly'
import { TemplatesListPage } from '@/views/TemplatesListPage'

export default function FavouritesPage() {
  return (
    <ClientOnly>
      <TemplatesListPage favouritesOnly />
    </ClientOnly>
  )
}
