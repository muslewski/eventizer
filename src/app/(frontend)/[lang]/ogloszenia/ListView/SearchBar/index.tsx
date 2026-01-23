'use client'

import Search from '@/app/(frontend)/[lang]/ogloszenia/ListView/SearchBar/Search'
import { Settings2Icon } from 'lucide-react'

export default function SearchBar() {
  return (
    <div className="flex gap-6 h-16 min-h-16">
      {/* Search */}
      <Search />

      {/* Settings */}
      <div className="flex h-full px-6 py-4 items-center bg-black/60 border rounded-2xl">
        <Settings2Icon size={22} />
      </div>
    </div>
  )
}
