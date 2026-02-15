import ClientListView from '@/app/(frontend)/[lang]/ogloszenia/ListView/index.client'
import type { BasePayload } from 'payload'
import type { OfferSearchParams } from './types'
import { parseSearchParams, queryOffers } from './utils'

interface ListViewProps {
  payload: BasePayload
  strona?: string
  kategoria?: string
  szukaj?: string
  sortuj?: string
  lat?: string
  lng?: string
  odleglosc?: string
  minCena?: number
  maxCena?: number
}

export default async function ListView({ payload, ...searchParams }: ListViewProps) {
  const params = parseSearchParams(searchParams as OfferSearchParams)

  // Query offers with all filters and sorting
  const { offers, pagination } = await queryOffers(payload, params)

  // Fetch categories for sidebar
  const categories = await payload.find({
    collection: 'service-categories',
    limit: 100,
    overrideAccess: true,
  })

  return (
    <ClientListView
      offers={offers}
      categoryData={categories.docs}
      pagination={pagination}
      currentSort={params.sortuj}
      currentLat={params.lat}
      currentLng={params.lng}
      currentDistance={params.odleglosc}
      minCena={params.minCena}
      maxCena={params.maxCena}
    />
  )
}
