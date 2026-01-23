import ClientListView from '@/app/(frontend)/[lang]/ogloszenia/ListView/index.client'
import type { BasePayload, Where } from 'payload'
import type { Offer } from '@/payload-types'

interface ListViewProps {
  payload: BasePayload
  strona?: string
  kategoria?: string
  szukaj?: string
}

export default async function ListView({ payload, strona, kategoria, szukaj }: ListViewProps) {
  const page = Number(strona) || 1
  const limit = 10

  // Build base conditions array
  const baseConditions: Where[] = [{ _status: { equals: 'published' } }]

  // Add category filter if present
  if (kategoria) {
    baseConditions.push({
      or: [{ categorySlug: { equals: kategoria } }, { categorySlug: { like: `${kategoria}/%` } }],
    })
  }

  let offersData: Offer[] = []
  let totalDocs = 0
  let totalPages = 1
  let hasNextPage = false
  let hasPrevPage = false
  let nextPage: number | undefined
  let prevPage: number | undefined
  let currentPage = page

  if (szukaj && szukaj.trim()) {
    const searchTerm = szukaj.trim()

    // Query 1: Title matches (higher priority)
    const titleWhere: Where = {
      and: [...baseConditions, { title: { contains: searchTerm } }],
    }

    // Query 2: All matches (title OR description)
    const allMatchesWhere: Where = {
      and: [
        ...baseConditions,
        {
          or: [{ title: { contains: searchTerm } }, { shortDescription: { contains: searchTerm } }],
        },
      ],
    }

    // First, get counts for both queries (cheap operation)
    const [titleCount, allMatchesCount] = await Promise.all([
      payload.count({
        collection: 'offers',
        where: titleWhere,
        overrideAccess: true,
      }),
      payload.count({
        collection: 'offers',
        where: allMatchesWhere,
        overrideAccess: true,
      }),
    ])

    // Description-only count is total minus title matches
    const descriptionCount = allMatchesCount.totalDocs - titleCount.totalDocs
    totalDocs = allMatchesCount.totalDocs
    totalPages = Math.ceil(totalDocs / limit) || 1
    currentPage = Math.min(page, totalPages) || 1
    hasNextPage = currentPage < totalPages
    hasPrevPage = currentPage > 1
    nextPage = hasNextPage ? currentPage + 1 : undefined
    prevPage = hasPrevPage ? currentPage - 1 : undefined

    // Calculate which results to fetch based on page
    const offset = (currentPage - 1) * limit
    const titleTotal = titleCount.totalDocs

    if (offset < titleTotal) {
      // Calculate correct page for title results
      const titlePage = Math.floor(offset / limit) + 1
      const titleLimit = Math.min(limit, titleTotal - offset)

      const titleResults = await payload.find({
        collection: 'offers',
        where: titleWhere,
        limit: titleLimit,
        page: titlePage,
        overrideAccess: true,
      })

      offersData = [...titleResults.docs]

      // If we need more to fill the page, get from all matches and filter out title matches
      const remaining = limit - offersData.length
      if (remaining > 0 && descriptionCount > 0) {
        const titleIds = new Set(offersData.map((doc) => doc.id))
        const allResults = await payload.find({
          collection: 'offers',
          where: allMatchesWhere,
          limit: remaining + titleIds.size, // Fetch extra to account for filtering
          page: Math.floor(titleTotal / limit) + 1,
          overrideAccess: true,
        })
        const descOnlyResults = allResults.docs.filter((doc) => !titleIds.has(doc.id))
        offersData = [...offersData, ...descOnlyResults.slice(0, remaining)]
      }
    } else {
      // We're past all title results, fetch all matches and filter out title matches
      const descOffset = offset - titleTotal
      const allResultsPage = Math.floor(offset / limit) + 1

      const allResults = await payload.find({
        collection: 'offers',
        where: allMatchesWhere,
        limit: limit * 2, // Fetch extra to ensure we have enough after filtering
        page: allResultsPage,
        overrideAccess: true,
      })

      // Get title matches to exclude
      const titleResults = await payload.find({
        collection: 'offers',
        where: titleWhere,
        limit: titleTotal,
        overrideAccess: true,
      })
      const titleIds = new Set(titleResults.docs.map((doc) => doc.id))

      // Filter out title matches and take only what we need
      offersData = allResults.docs.filter((doc) => !titleIds.has(doc.id)).slice(0, limit)
    }

    // Final deduplication safety
    const seenIds = new Set<number>()
    offersData = offersData.filter((offer) => {
      if (seenIds.has(offer.id)) {
        return false
      }
      seenIds.add(offer.id)
      return true
    })
  } else {
    // No search term - use simple query
    const baseWhere: Where =
      baseConditions.length === 1 ? baseConditions[0] : { and: baseConditions }

    const result = await payload.find({
      collection: 'offers',
      limit,
      overrideAccess: true,
      page,
      where: baseWhere,
    })

    offersData = result.docs
    totalDocs = result.totalDocs
    totalPages = result.totalPages
    currentPage = result.page ?? 1
    hasNextPage = result.hasNextPage
    hasPrevPage = result.hasPrevPage
    nextPage = result.nextPage ?? undefined
    prevPage = result.prevPage ?? undefined
  }

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
        currentPage,
        totalPages,
        totalDocs,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage,
      }}
    />
  )
}
