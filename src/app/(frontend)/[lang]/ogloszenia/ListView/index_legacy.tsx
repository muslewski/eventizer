import ClientListView from '@/app/(frontend)/[lang]/ogloszenia/ListView/index.client'
import type { BasePayload, Where } from 'payload'

interface ListViewProps {
  payload: BasePayload
  strona?: string
  kategoria?: string
  szukaj?: string
}

export default async function ListView({ payload, strona, kategoria, szukaj }: ListViewProps) {
  // Build where clause
  const whereClause: Where = {
    _status: { equals: 'published' },
  }

  const andConditions: Where[] = []

  // Match exact category OR subcategories that start with this category path
  if (kategoria) {
    whereClause.or = [
      { categorySlug: { equals: kategoria } },
      { categorySlug: { like: `${kategoria}/%` } },
    ]
  }

  // Search in title and shortDescription
  if (szukaj && szukaj.trim()) {
    const searchTerm = szukaj.trim()
    andConditions.push({
      or: [{ title: { contains: searchTerm } }, { shortDescription: { contains: searchTerm } }],
    })
  }

  // Combine conditions
  if (andConditions.length > 0) {
    whereClause.and = andConditions
  }

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
    where: whereClause,
  })

  const offersData = docs || null

  // Find categories for sidebar
  const categories = await payload.find({
    collection: 'service-categories',
    limit: 100,
    overrideAccess: true,
  })

  return (
    <ClientListView
      offers={offersData}
      categoryData={categories.docs}
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
