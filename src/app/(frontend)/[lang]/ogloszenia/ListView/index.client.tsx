'use client'

import { Offer, ServiceCategory } from '@/payload-types'
import OffersView from '@/app/(frontend)/[lang]/ogloszenia/ListView/OffersView'
import { usePathname } from 'next/navigation'
import SearchBar from '@/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar'
import CategorySelection from '@/app/(frontend)/[lang]/ogloszenia/ListView/CategorySelection'
import { SortOption } from '@/app/(frontend)/[lang]/ogloszenia/ListView/types'

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
  pagination: PaginationInfo
  currentSort: SortOption
  minCena?: number
  maxCena?: number
}

export default function ClientListView({
  offers,
  categoryData,
  pagination,
  currentSort,
  minCena,
  maxCena,
}: ClientListViewProps) {
  const pathname = usePathname()

  return (
    <div
      className="flex flex-col md:flex-row w-full -mt-16 pt-16 gap-8 md:h-screen md:max-h-screen "
      id="oferty"
    >
      {/* Category Selection */}
      <CategorySelection categoryData={categoryData} />

      {/* Main Search bar and offers */}
      <div className="w-full max-w-375 h-full min-w-0 py-0 flex flex-col gap-8 ">
        {/* Search Bar */}
        <SearchBar currentSort={currentSort} minPrice={minCena} maxPrice={maxCena} />

        {/* Display offers */}
        <OffersView offers={offers} pagination={pagination} pathname={pathname} />
      </div>

      {/* right side with selected offers */}
      {/* <div className="max-w-md hidden 2xl:flex w-full h-full border-l rounded-l-2xl p-8 flex-col gap-12">
        <div>
          <TitleH3 title={'Ogłoszenie'} />
        </div>

        //Special offer
        <div className="mt-auto">
          <TitleH3 title={'Oferta specjalna'} />
        </div>
      </div> */}
    </div>
  )
}
