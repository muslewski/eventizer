'use client'

import { TitleH3 } from '@/components/frontend/Content/TitleH3'
import { Offer } from '@/payload-types'
import { Search, Settings2Icon } from 'lucide-react'
import OffersView from '@/app/(frontend)/[lang]/ogloszenia/ListView/OffersView'
import { usePathname } from 'next/navigation'
import SearchBar from '@/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar'

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalDocs: number
  hasNextPage: boolean
  hasPrevPage: boolean
  nextPage?: number
  prevPage?: number
}

interface ClientListViewProps {
  offers: Offer[] | null
  pagination: PaginationInfo
}

export default function ClientListView({ offers, pagination }: ClientListViewProps) {
  const pathname = usePathname()

  return (
    <div className="flex w-full gap-8 h-screen max-h-screen">
      {/* Category Selection */}
      <div className="max-w-64 w-1/4 h-full border-r rounded-r-2xl p-8">
        <TitleH3 title={'Kategorie'} />
      </div>

      {/* Main Search bar and offers */}
      <div className="w-full max-w-6xl h-full min-w-0 py-0 flex flex-col gap-8 ">
        {/* Search Bar */}
        <SearchBar />

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
