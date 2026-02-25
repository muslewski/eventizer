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
import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useListViewTransition } from '@/app/(frontend)/[lang]/ogloszenia/ListView/TransitionContext'

interface SortSelectProps {
  currentSort: SortOption
}

export default function SortSelect({ currentSort }: SortSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isPending, startTransition } = useListViewTransition()

  const handleSortChange = useCallback(
    (value: SortOption) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value === 'random') {
        params.delete('sortuj')
        // Generate a fresh seed for the new random order
        params.set('seed', String(Math.floor(Math.random() * 2147483647) + 1))
      } else {
        params.set('sortuj', value)
        // Remove seed when not using random sort
        params.delete('seed')
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
    'random',
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
