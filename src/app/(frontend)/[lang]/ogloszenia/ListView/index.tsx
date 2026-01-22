import ClientListView from '@/app/(frontend)/[lang]/ogloszenia/ListView/index.client'
import type { BasePayload } from 'payload'

interface ListViewProps {
  payload: BasePayload
  strona?: string
}

export default async function ListView({ payload, strona }: ListViewProps) {
  // find 10 offers (using overrideAccess since this is public frontend view)
  const {
    docs,
    page: currentPage,
    totalPages,
    totalDocs,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
  } = await payload.find({
    collection: 'offers',
    limit: 10,
    overrideAccess: true,
    page: Number(strona) || 1,
    where: {
      _status: { equals: 'published' },
    },
  })

  const offersData = docs || null

  return (
    <ClientListView
      offers={offersData}
      pagination={{
        currentPage: currentPage ?? 1,
        totalPages,
        totalDocs,
        hasNextPage,
        hasPrevPage,
        nextPage: nextPage ?? undefined,
        prevPage: prevPage ?? undefined,
      }}
    />
  )
}
