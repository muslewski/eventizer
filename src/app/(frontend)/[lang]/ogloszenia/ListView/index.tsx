import ClientListView from '@/app/(frontend)/[lang]/ogloszenia/ListView/index.client'
import type { BasePayload } from 'payload'
import type { OfferSearchParams } from './types'
import { parseSearchParams, queryOffers } from './utils'
import { cookies } from 'next/headers'

interface ListViewProps {
  payload: BasePayload
  strona?: string
  kategoria?: string
  rodzaj?: string
  szukaj?: string
  sortuj?: string
  lat?: string
  lng?: string
  odleglosc?: string
  minCena?: number
  maxCena?: number
}

export default async function ListView({ payload, ...searchParams }: ListViewProps) {
  const cookieStore = await cookies()
  const cookieSeed = cookieStore.get('random-seed')?.value
  const seed = cookieSeed ? Number(cookieSeed) : undefined

  const params = parseSearchParams(searchParams as OfferSearchParams, seed)

  // Query offers with all filters and sorting
  const { offers, pagination } = await queryOffers(payload, params)

  // Fetch categories and active event types in parallel
  const [categories, eventTypes] = await Promise.all([
    payload.find({
      collection: 'service-categories',
      limit: 100,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'event-types',
      where: { isActive: { equals: true } },
      sort: '_order',
      depth: 1,
      limit: 0,
      overrideAccess: true,
    }),
  ])

  return (
    <ClientListView
      offers={offers}
      categoryData={categories.docs}
      eventTypes={eventTypes.docs}
      currentRodzaj={params.rodzaj}
      pagination={pagination}
      currentSort={params.sortuj}
      currentLat={params.lat}
      currentLng={params.lng}
      currentDistance={params.odleglosc}
      minCena={params.minCena}
      maxCena={params.maxCena}
      seed={params.seed}
    />
  )
}
