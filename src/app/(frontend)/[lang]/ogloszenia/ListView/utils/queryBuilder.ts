import type { BasePayload, Where } from 'payload'
import type { Offer, OffersSelect } from '@/payload-types'
import type { ParsedSearchParams, OffersQueryResult, PaginationInfo, SortOption } from '../types'
import { getSortField, requiresInMemorySort, sortOffersInMemory } from './sorting'
import { getBoundingBox, haversineDistance, filterByDistance } from './distance'
import { buildBaseConditions, buildPriceConditions, buildSearchWhere } from './conditions'

/**
 * Two-phase fetch (phase 1 — "lite").
 *
 * The in-memory sort/geo paths must consider EVERY matching offer to order or
 * distance-filter them, but they only ever display one page. Hydrating the
 * whole catalogue at full depth (uploads + relationships) just to keep 10 rows
 * is O(n) per page view. Instead, phase 1 fetches only the scalar columns the
 * ordering/filtering actually reads, with `depth: 0` so no joins run. Phase 2
 * (`hydrateOffersByIds`) then hydrates just the page's rows.
 *
 * - random sort → only `id` is needed (the shuffle is id-agnostic).
 * - price sort → the price fields feed `calculateEffectivePrice`.
 * - geo filter → the `location` group feeds the Haversine distance check.
 */
function liteSelect(sortuj: SortOption, geo: boolean): OffersSelect<true> {
  const needsPrice = sortuj === 'price-asc' || sortuj === 'price-desc'
  // `id` is always returned by Payload and is not a selectable key, so an empty
  // select (the random case) still yields rows carrying their id.
  return {
    ...(needsPrice
      ? { price: true, priceFrom: true, priceTo: true, hasPriceRange: true }
      : {}),
    ...(geo ? { location: true } : {}),
  }
}

/**
 * Two-phase fetch (phase 2 — "hydrate").
 *
 * Hydrate a specific, ordered set of offer IDs at the default depth and return
 * them in the SAME order as `ids`. Postgres `IN (...)` does not preserve the
 * argument order, so we re-map through the requested id sequence — this keeps
 * the in-memory sort order (random shuffle, price, distance) intact for the
 * rendered page.
 */
export async function hydrateOffersByIds(
  payload: BasePayload,
  ids: number[],
): Promise<Offer[]> {
  if (ids.length === 0) return []

  const { docs } = await payload.find({
    collection: 'offers',
    where: { id: { in: ids } },
    limit: ids.length,
    overrideAccess: true,
  })

  const byId = new Map(docs.map((doc) => [doc.id, doc]))
  return ids.map((id) => byId.get(id)).filter((doc): doc is Offer => Boolean(doc))
}

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

  // For in-memory sorting, we need to consider every matching result. Phase 1
  // fetches only the ordering columns (lite); phase 2 hydrates the page.
  if (needsInMemorySort) {
    const select = liteSelect(sortuj, false)
    const [titleResults, allResults] = await Promise.all([
      payload.find({
        collection: 'offers',
        where: titleWhere,
        limit: 0, // Fetch all
        depth: 0,
        overrideAccess: true,
        select,
      }),
      payload.find({
        collection: 'offers',
        where: allMatchesWhere,
        limit: 0,
        depth: 0,
        overrideAccess: true,
        select,
      }),
    ])

    const titleIds = new Set(titleResults.docs.map((doc) => doc.id))
    const descOnlyResults = allResults.docs.filter((doc) => !titleIds.has(doc.id))

    // Sort each group separately, then combine (title matches first)
    const sortedTitles = sortOffersInMemory(titleResults.docs as Offer[], sortuj, params.seed)
    const sortedDesc = sortOffersInMemory(descOnlyResults as Offer[], sortuj, params.seed)

    const pageIds = [...sortedTitles, ...sortedDesc]
      .slice(offset, offset + limit)
      .map((doc) => doc.id)
    offersData = await hydrateOffersByIds(payload, pageIds)
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
    // Phase 1: fetch only the columns needed to order the full result set —
    // no joins, no per-row hydration (see liteSelect / hydrateOffersByIds).
    const lite = await payload.find({
      collection: 'offers',
      limit: 0,
      depth: 0,
      overrideAccess: true,
      where: baseWhere,
      select: liteSelect(sortuj, false),
    })

    const sortedOffers = sortOffersInMemory(lite.docs as Offer[], sortuj, params.seed)
    const pagination = calculatePagination(lite.totalDocs, limit, page)
    const offset = (pagination.currentPage - 1) * limit
    const pageIds = sortedOffers.slice(offset, offset + limit).map((doc) => doc.id)

    // Phase 2: hydrate only this page's rows, preserving the sorted order.
    return {
      offers: await hydrateOffersByIds(payload, pageIds),
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

  // Phase 1: fetch all bounding-box matches but only the columns needed to
  // distance-filter and order them (id + location, plus price if price-sorted).
  // The DB sort still applies for non-in-memory sorts even though those columns
  // aren't selected. (limit: 0 = unlimited)
  const lite = await payload.find({
    collection: 'offers',
    where,
    limit: 0,
    depth: 0,
    sort: sortField,
    overrideAccess: true,
    select: liteSelect(sortuj, true),
  })

  // Apply precise Haversine distance filter
  let filtered = filterByDistance(lite.docs as Offer[], lat!, lng!, odleglosc!)

  // Apply in-memory sorting if needed (otherwise the DB `sort` order is kept)
  if (requiresInMemorySort(sortuj)) {
    filtered = sortOffersInMemory(filtered, sortuj, params.seed)
  }

  const pagination = calculatePagination(filtered.length, limit, page)
  const offset = (pagination.currentPage - 1) * limit
  const pageIds = filtered.slice(offset, offset + limit).map((doc) => doc.id)

  // Phase 2: hydrate only this page's rows, preserving the filtered order.
  return {
    offers: await hydrateOffersByIds(payload, pageIds),
    pagination,
  }
}
