import ClientListView from '@/app/(frontend)/[lang]/ogloszenia/ListView/index.client'
import type { BasePayload } from 'payload'

interface ListViewProps {
  payload: BasePayload
}

export default async function ListView({ payload }: ListViewProps) {
  // find 10 offers (using overrideAccess since this is public frontend view)
  const { docs } = await payload.find({
    collection: 'offers',
    limit: 10,
    overrideAccess: true,
    where: {
      _status: { equals: 'published' },
    },
  })

  const offersData = docs || null

  return <ClientListView offers={offersData} />
}
