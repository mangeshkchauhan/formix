import { ClientOnly } from '@/components/ClientOnly'
import { FillPage } from '@/views/FillPage'

export default function FillRoute() {
  return (
    <ClientOnly>
      <FillPage />
    </ClientOnly>
  )
}
