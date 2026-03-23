import type { BasePayload, Where } from 'payload'
import type { Offer } from '@/payload-types'
import type { ParsedSearchParams, OffersQueryResult, PaginationInfo } from '../types'
import { getSortField, requiresInMemorySort, sortOffersInMemory } from './sorting'
import { getBoundingBox, haversineDistance, filterByDistance } from './distance'
import { buildBaseConditions, buildPriceConditions, buildSearchWhere } from './conditions'

/**
 * Calculate pagination info from raw values
 */
function calculatePagination(
  totalDocs: number,
  limit: number,
  requestedPage: number,
): PaginationInfo {
  const totalPages = Math.ceil(totalDocs / limit) || 1
  const currentPage = Math.min(requestedPage, totalPages) || 1
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  return {
    currentPage,
    totalPages,
    totalDocs,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? currentPage + 1 : undefined,
    prevPage: hasPrevPage ? currentPage - 1 : undefined,
  }
}

/**
 * Deduplicate offers by ID
 */
function deduplicateOffers(offers: Offer[]): Offer[] {
  const seenIds = new Set<number>()
  return offers.filter((offer) => {
    if (seenIds.has(offer.id)) return false
    seenIds.add(offer.id)
    return true
  })
}

/**
 * Query offers with search term (prioritized search)
 */
async function queryWithSearch(
  payload: BasePayload,
  params: ParsedSearchParams,
  baseConditions: Where[],
): Promise<OffersQueryResult> {
  const searchTerm = params.szukaj!.trim()
  const { page, limit, sortuj } = params
  const sortField = getSortField(sortuj)
  const needsInMemorySort = requiresInMemorySort(sortuj)

  const titleWhere = buildSearchWhere(baseConditions, searchTerm, 'title')
  const allMatchesWhere = buildSearchWhere(baseConditions, searchTerm, 'all')

  // Get counts first
  const [titleCount, allMatchesCount] = await Promise.all([
    payload.count({ collection: 'offers', where: titleWhere, overrideAccess: true }),
    payload.count({ collection: 'offers', where: allMatchesWhere, overrideAccess: true }),
  ])

  const titleTotal = titleCount.totalDocs
  const descriptionCount = allMatchesCount.totalDocs - titleTotal
  const totalDocs = allMatchesCount.totalDocs
  const pagination = calculatePagination(totalDocs, limit, page)
  const offset = (pagination.currentPage - 1) * limit

  let offersData: Offer[] = []

  // For in-memory sorting, we need to fetch all matching results
  if (needsInMemorySort) {
    const [titleResults, allResults] = await Promise.all([
      payload.find({
        collection: 'offers',
        where: titleWhere,
        limit: 0, // Fetch all
        overrideAccess: true,
      }),
      payload.find({
        collection: 'offers',
        where: allMatchesWhere,
        limit: 0,
        overrideAccess: true,
      }),
    ])

    const titleIds = new Set(titleResults.docs.map((doc) => doc.id))
    const descOnlyResults = allResults.docs.filter((doc) => !titleIds.has(doc.id))

    // Sort each group separately, then combine (title matches first)
    const sortedTitles = sortOffersInMemory(titleResults.docs, sortuj, params.seed)
    const sortedDesc = sortOffersInMemory(descOnlyResults, sortuj, params.seed)

    const allSorted = [...sortedTitles, ...sortedDesc]
    offersData = allSorted.slice(offset, offset + limit)
  } else {
    // Standard pagination with database sorting
    if (offset < titleTotal) {
      const titlePage = Math.floor(offset / limit) + 1
      const titleLimit = Math.min(limit, titleTotal - offset)

      const titleResults = await payload.find({
        collection: 'offers',
        where: titleWhere,
        limit: titleLimit,
        page: titlePage,
        sort: sortField,
        overrideAccess: true,
      })

      offersData = [...titleResults.docs]

      const remaining = limit - offersData.length
      if (remaining > 0 && descriptionCount > 0) {
        const titleIds = new Set(offersData.map((doc) => doc.id))
        const allResults = await payload.find({
          collection: 'offers',
          where: allMatchesWhere,
          limit: remaining + titleIds.size,
          page: Math.floor(titleTotal / limit) + 1,
          sort: sortField,
          overrideAccess: true,
        })
        const descOnlyResults = allResults.docs.filter((doc) => !titleIds.has(doc.id))
        offersData = [...offersData, ...descOnlyResults.slice(0, remaining)]
      }
    } else {
      const allResultsPage = Math.floor(offset / limit) + 1

      const allResults = await payload.find({
        collection: 'offers',
        where: allMatchesWhere,
        limit: limit * 2,
        page: allResultsPage,
        sort: sortField,
        overrideAccess: true,
      })

      const titleResults = await payload.find({
        collection: 'offers',
        where: titleWhere,
        limit: titleTotal,
        sort: sortField,
        overrideAccess: true,
      })

      const titleIds = new Set(titleResults.docs.map((doc) => doc.id))
      offersData = allResults.docs.filter((doc) => !titleIds.has(doc.id)).slice(0, limit)
    }
  }

  return {
    offers: deduplicateOffers(offersData),
    pagination,
  }
}

/**
 * Query offers without search term (simple query)
 */
async function queryWithoutSearch(
  payload: BasePayload,
  params: ParsedSearchParams,
  baseConditions: Where[],
): Promise<OffersQueryResult> {
  const { page, limit, sortuj } = params
  const sortField = getSortField(sortuj)
  const needsInMemorySort = requiresInMemorySort(sortuj)

  const baseWhere: Where = baseConditions.length === 1 ? baseConditions[0] : { and: baseConditions }

  if (needsInMemorySort) {
    // Fetch all for in-memory sorting
    const result = await payload.find({
      collection: 'offers',
      limit: 0,
      overrideAccess: true,
      where: baseWhere,
    })

    const sortedOffers = sortOffersInMemory(result.docs, sortuj, params.seed)
    const pagination = calculatePagination(result.totalDocs, limit, page)
    const offset = (pagination.currentPage - 1) * limit

    return {
      offers: sortedOffers.slice(offset, offset + limit),
      pagination,
    }
  }

  const result = await payload.find({
    collection: 'offers',
    limit,
    overrideAccess: true,
    page,
    where: baseWhere,
    sort: sortField,
  })

  return {
    offers: result.docs,
    pagination: {
      currentPage: result.page ?? 1,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
      nextPage: result.nextPage ?? undefined,
      prevPage: result.prevPage ?? undefined,
    },
  }
}

/**
 * Main query function - entry point for fetching offers
 */
export async function queryOffers(
  payload: BasePayload,
  params: ParsedSearchParams,
): Promise<OffersQueryResult> {
  const baseConditions = buildBaseConditions(params)
  const hasGeoFilter =
    params.lat !== undefined && params.lng !== undefined && params.odleglosc !== undefined

  // If geo filter is active, we need to fetch all bounding-box matches,
  // apply precise Haversine filter, then paginate in-memory
  if (hasGeoFilter) {
    return queryWithGeoFilter(payload, params, baseConditions)
  }

  if (params.szukaj?.trim()) {
    return queryWithSearch(payload, params, baseConditions)
  }

  return queryWithoutSearch(payload, params, baseConditions)
}

/**
 * Query offers with geo-based filtering.
 * Fetches all bounding-box matches, applies Haversine filter, then paginates.
 */
async function queryWithGeoFilter(
  payload: BasePayload,
  params: ParsedSearchParams,
  baseConditions: Where[],
): Promise<OffersQueryResult> {
  const { page, limit, sortuj, lat, lng, odleglosc } = params
  const sortField = getSortField(sortuj)

  const baseWhere: Where = baseConditions.length === 1 ? baseConditions[0] : { and: baseConditions }

  // Also add search conditions if present
  let where: Where = baseWhere
  if (params.szukaj?.trim()) {
    where = {
      and: [
        ...baseConditions,
        {
          or: [
            { title: { contains: params.szukaj.trim() } },
            { shortDescription: { contains: params.szukaj.trim() } },
          ],
        },
      ],
    }
  }

  // Fetch all bounding-box matches (limit: 0 = unlimited)
  const result = await payload.find({
    collection: 'offers',
    where,
    limit: 0,
    sort: sortField,
    overrideAccess: true,
  })

  // Apply precise Haversine distance filter
  let filtered = filterByDistance(result.docs, lat!, lng!, odleglosc!)

  // Apply in-memory sorting if needed
  if (requiresInMemorySort(sortuj)) {
    filtered = sortOffersInMemory(filtered, sortuj, params.seed)
  }

  const pagination = calculatePagination(filtered.length, limit, page)
  const offset = (pagination.currentPage - 1) * limit

  return {
    offers: filtered.slice(offset, offset + limit),
    pagination,
  }
}
