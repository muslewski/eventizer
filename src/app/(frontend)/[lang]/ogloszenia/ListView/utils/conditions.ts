import type { Where } from 'payload'
import type { ParsedSearchParams } from '../types'
import { getBoundingBox } from './distance'

/**
 * Build base where conditions that apply to all queries
 */
export function buildBaseConditions(params: ParsedSearchParams): Where[] {
  const conditions: Where[] = [{ _status: { equals: 'published' } }]

  if (params.kategoria) {
    conditions.push({
      or: [
        { categorySlug: { equals: params.kategoria } },
        { categorySlug: { like: `${params.kategoria}/%` } },
      ],
    })
  }

  if (params.rodzaj) {
    conditions.push({
      or: [
        { 'eventTypes.slug': { equals: params.rodzaj } },
        { eventTypes: { exists: false } },
      ],
    })
  }

  // Add geo bounding box filter for location-based search
  if (params.lat !== undefined && params.lng !== undefined && params.odleglosc !== undefined) {
    // Use a generous bounding box (search radius + max possible service radius of 500km)
    const maxRadius = params.odleglosc + 500
    const bbox = getBoundingBox(params.lat, params.lng, maxRadius)

    conditions.push({
      and: [
        { 'location.lat': { greater_than_equal: bbox.minLat } },
        { 'location.lat': { less_than_equal: bbox.maxLat } },
        { 'location.lng': { greater_than_equal: bbox.minLng } },
        { 'location.lng': { less_than_equal: bbox.maxLng } },
      ],
    })
  }

  // Add price range conditions
  const priceConditions = buildPriceConditions(params.minCena, params.maxCena)
  conditions.push(...priceConditions)

  return conditions
}

/**
 * Build price range conditions
 * Handles both single price and price range offers
 */
export function buildPriceConditions(minCena?: number, maxCena?: number): Where[] {
  const conditions: Where[] = []

  if (minCena !== undefined) {
    // For single price: price >= minCena
    // For range: priceTo >= minCena (the max of the range should be at least minCena)
    conditions.push({
      or: [
        {
          and: [{ hasPriceRange: { equals: false } }, { price: { greater_than_equal: minCena } }],
        },
        {
          and: [{ hasPriceRange: { equals: true } }, { priceTo: { greater_than_equal: minCena } }],
        },
      ],
    })
  }

  if (maxCena !== undefined) {
    // For single price: price <= maxCena
    // For range: priceFrom <= maxCena (the min of the range should be at most maxCena)
    conditions.push({
      or: [
        {
          and: [{ hasPriceRange: { equals: false } }, { price: { less_than_equal: maxCena } }],
        },
        {
          and: [{ hasPriceRange: { equals: true } }, { priceFrom: { less_than_equal: maxCena } }],
        },
      ],
    })
  }

  return conditions
}

/**
 * Build search-specific where clause
 */
export function buildSearchWhere(
  baseConditions: Where[],
  searchTerm: string,
  searchType: 'title' | 'all',
): Where {
  if (searchType === 'title') {
    return {
      and: [...baseConditions, { title: { contains: searchTerm } }],
    }
  }

  return {
    and: [
      ...baseConditions,
      {
        or: [{ title: { contains: searchTerm } }, { shortDescription: { contains: searchTerm } }],
      },
    ],
  }
}
