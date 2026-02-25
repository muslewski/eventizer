import type { OfferSearchParams, ParsedSearchParams } from '../types'
import { parseSortOption } from './sorting'

const DEFAULT_LIMIT = 10
const DEFAULT_DISTANCE_KM = 50

/**
 * Generate a random seed (integer) for deterministic shuffling.
 * Used when random sort is active and no seed is provided in the URL.
 */
function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647) + 1
}

export function parseSearchParams(params: OfferSearchParams): ParsedSearchParams {
  const lat = params.lat ? Number(params.lat) : undefined
  const lng = params.lng ? Number(params.lng) : undefined

  // Only include location params if both lat and lng are valid
  const hasValidLocation = lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)

  const sortuj = parseSortOption(params.sortuj)

  // For random sort, use existing seed from URL or generate a new one
  const seed =
    sortuj === 'random'
      ? (params.seed ? Number(params.seed) : generateSeed())
      : undefined

  return {
    page: Number(params.strona) || 1,
    limit: DEFAULT_LIMIT,
    kategoria: params.kategoria,
    szukaj: params.szukaj,
    sortuj,
    lat: hasValidLocation ? lat : undefined,
    lng: hasValidLocation ? lng : undefined,
    odleglosc: hasValidLocation
      ? (params.odleglosc ? Number(params.odleglosc) : DEFAULT_DISTANCE_KM)
      : undefined,
    minCena: params.minCena ? Number(params.minCena) : undefined,
    maxCena: params.maxCena ? Number(params.maxCena) : undefined,
    seed,
  }
}
