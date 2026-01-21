import ClientListView from '@/app/(frontend)/[lang]/ogloszenia/ListView/index.client'
import type { BasePayload } from 'payload'

interface ListViewProps {
  payload: BasePayload
}

export default async function ListView({ payload }: ListViewProps) {
  // find 10 offers
  const { docs } = await payload.find({
    collection: 'offers',
    limit: 10,
  })

  const offersData = docs || null

  return <ClientListView offers={offersData} />
}
