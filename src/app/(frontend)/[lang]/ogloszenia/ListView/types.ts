import type { Offer, ServiceCategory } from '@/payload-types'

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'price-asc'
  | 'price-desc'
  | 'title-asc'
  | 'title-desc'
// Future options
//   | 'most-viewed'
//   | 'highest-rated'

export interface OfferSearchParams {
  strona?: string
  kategoria?: string
  szukaj?: string
  sortuj?: SortOption
  lat?: string
  lng?: string
  odleglosc?: string
  minCena?: string
  maxCena?: string
}

export interface ParsedSearchParams {
  page: number
  limit: number
  kategoria?: string
  szukaj?: string
  sortuj: SortOption
  lat?: number
  lng?: number
  odleglosc?: number
  minCena?: number
  maxCena?: number
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalDocs: number
  hasNextPage: boolean
  hasPrevPage: boolean
  nextPage?: number
  prevPage?: number
}

export interface OffersQueryResult {
  offers: Offer[]
  pagination: PaginationInfo
}

export interface ListViewData extends OffersQueryResult {
  categories: ServiceCategory[]
}
