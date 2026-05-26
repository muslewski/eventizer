'use client'

import { useEffect } from 'react'
import { Offer, ServiceCategory, EventType } from '@/payload-types'
import OffersView from '@/app/(frontend)/[lang]/ogloszenia/ListView/OffersView'
import { usePathname } from 'next/navigation'
import SearchBar from '@/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar'
import CategorySelection from '@/app/(frontend)/[lang]/ogloszenia/ListView/CategorySelection'
import EventTypeStrip from '@/app/(frontend)/[lang]/ogloszenia/ListView/EventTypeStrip'
import { SortOption } from '@/app/(frontend)/[lang]/ogloszenia/ListView/types'
import { ListViewTransitionProvider } from '@/app/(frontend)/[lang]/ogloszenia/ListView/TransitionContext'
import { GoogleMapsProvider } from '@/components/providers/GoogleMapsProvider'

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalDocs: number
  hasNextPage: boolean
  hasPrevPage: boolean
  nextPage?: number
  prevPage?: number
  minCena?: number
  maxCena?: number
}

interface ClientListViewProps {
  offers: Offer[] | null
  categoryData?: ServiceCategory[]
  eventTypes: EventType[]
  currentRodzaj?: string
  pagination: PaginationInfo
  currentSort: SortOption
  currentLat?: number
  currentLng?: number
  currentDistance?: number
  minCena?: number
  maxCena?: number
  seed?: number
}

export default function ClientListView({
  offers,
  categoryData,
  eventTypes,
  currentRodzaj,
  pagination,
  currentSort,
  currentLat,
  currentLng,
  currentDistance,
  minCena,
  maxCena,
  seed,
}: ClientListViewProps) {
  const pathname = usePathname()

  useEffect(() => {
    if (seed !== undefined) {
      document.cookie = `random-seed=${seed}; path=/; SameSite=Lax`
    }
  }, [seed])

  return (
    <GoogleMapsProvider>
    <ListViewTransitionProvider>
    <div
      className="flex flex-col md:flex-row w-full -mt-8 pt-8 gap-8 md:h-screen md:max-h-screen "
      id="oferty"
    >
      <CategorySelection categoryData={categoryData} />

      <div className="w-full max-w-575 h-full min-w-0 py-0 flex flex-col gap-4">
        <div id="offers-search-anchor">
          <SearchBar
            currentSort={currentSort}
            currentLat={currentLat}
            currentLng={currentLng}
            currentDistance={currentDistance}
            minPrice={minCena}
            maxPrice={maxCena}
            eventTypes={eventTypes}
            currentRodzaj={currentRodzaj}
          />
        </div>

        <EventTypeStrip eventTypes={eventTypes} currentRodzaj={currentRodzaj} />

        <OffersView offers={offers} pagination={pagination} pathname={pathname} />
      </div>
    </div>
    </ListViewTransitionProvider>
    </GoogleMapsProvider>
  )
}
