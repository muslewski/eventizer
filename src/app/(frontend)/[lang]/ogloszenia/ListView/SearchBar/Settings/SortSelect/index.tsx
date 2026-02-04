'use client'

import { SortOption } from '@/app/(frontend)/[lang]/ogloszenia/ListView/types'
import { sortOptionLabels } from '@/app/(frontend)/[lang]/ogloszenia/ListView/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { cn } from '@/lib/utils'

interface SortSelectProps {
  currentSort: SortOption
}

export default function SortSelect({ currentSort }: SortSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleSortChange = useCallback(
    (value: SortOption) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value === 'newest') {
        params.delete('sortuj')
      } else {
        params.set('sortuj', value)
      }

      // Reset to page 1 when sorting changes
      params.delete('strona')

      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false })
      })
    },
    [router, searchParams],
  )

  const sortOptions: SortOption[] = [
    'newest',
    'oldest',
    'price-asc',
    'price-desc',
    'title-asc',
    'title-desc',
  ]

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="sort-select" className="text-sm font-medium">
        Sortuj:
      </label>
      <Select value={currentSort} onValueChange={handleSortChange} disabled={isPending}>
        <SelectTrigger
          id="sort-select"
          className={cn('w-full transition-opacity', isPending && 'opacity-50')}
        >
          <SelectValue placeholder="Wybierz sortowanie" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {sortOptionLabels[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
