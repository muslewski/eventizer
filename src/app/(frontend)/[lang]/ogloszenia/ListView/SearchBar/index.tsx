'use client'

import Search from '@/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/Search'
import PriceRangeInputs from '@/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/Settings/PriceRange'
import RegionSelect from '@/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/Settings/RegionSelect'
import SortSelect from '@/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/Settings/SortSelect'
import { SortOption } from '@/app/(frontend)/[lang]/ogloszenia/ListView/types'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Settings2Icon } from 'lucide-react'

export default function SearchBar({
  currentSort,
  currentRegion,
  minPrice,
  maxPrice,
}: {
  currentSort: SortOption
  currentRegion?: string
  minPrice?: number
  maxPrice?: number
}) {
  return (
    <div className="flex w-full gap-2 sm:gap-6 h-16 min-h-16">
      {/* Search */}
      <Search />

      {/* Settings */}
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex h-full px-6 py-4 items-center dark:bg-black/60 border rounded-2xl hover:bg-muted dark:hover:bg-black/80 transition-colors cursor-pointer">
            <Settings2Icon size={22} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-4 bg-background/50 backdrop-blur-md rounded-2xl"
          align="end"
        >
          <div className="flex flex-col gap-4">
            <h4 className="xl:text-4xl w-fit md:text-3xl sm:text-2xl text-xl font-bebas max-w-7xl text-foreground ">
              Ustawienia
            </h4>
            <SortSelect currentSort={currentSort} />

            {/* Region/Province filter */}
            <RegionSelect currentRegion={currentRegion} />

            {/* Range from and to price in pln */}
            <PriceRangeInputs minPrice={minPrice} maxPrice={maxPrice} />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
