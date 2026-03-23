import type { OfferSearchParams, ParsedSearchParams } from '../types'
import { parseSortOption } from './sorting'
import { cookies } from 'next/headers'

const DEFAULT_LIMIT = 10
const DEFAULT_DISTANCE_KM = 50

/**
 * Generate a random seed (integer) for deterministic shuffling.
 */
function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647) + 1
}

export async function parseSearchParams(params: OfferSearchParams): Promise<ParsedSearchParams> {
  const lat = params.lat ? Number(params.lat) : undefined
  const lng = params.lng ? Number(params.lng) : undefined

  // Only include location params if both lat and lng are valid
  const hasValidLocation = lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)

  const sortuj = parseSortOption(params.sortuj)

  // For random sort, read seed from cookie or generate a new one
  let seed: number | undefined
  if (sortuj === 'random') {
    const cookieStore = await cookies()
    const cookieSeed = cookieStore.get('random-seed')?.value
    seed = cookieSeed ? Number(cookieSeed) : generateSeed()
  }

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
