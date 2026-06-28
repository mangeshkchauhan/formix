import { ClientOnly } from '@/components/ClientOnly'
import { InstancesPage } from '@/views/InstancesPage'

export default function TemplateInstancesPage() {
  return (
    <ClientOnly>
      <InstancesPage />
    </ClientOnly>
  )
}
