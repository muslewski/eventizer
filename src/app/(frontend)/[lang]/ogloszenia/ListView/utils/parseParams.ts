import type { OfferSearchParams, ParsedSearchParams } from '../types'
import { parseSortOption } from './sorting'

const DEFAULT_LIMIT = 10

export function parseSearchParams(params: OfferSearchParams): ParsedSearchParams {
  return {
    page: Number(params.strona) || 1,
    limit: DEFAULT_LIMIT,
    kategoria: params.kategoria,
    szukaj: params.szukaj,
    sortuj: parseSortOption(params.sortuj),
    region: params.region,
    minCena: params.minCena ? Number(params.minCena) : undefined,
    maxCena: params.maxCena ? Number(params.maxCena) : undefined,
  }
}
