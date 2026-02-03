'use client'

import { POLISH_PROVINCES } from '@/collections/Offers'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface RegionSelectProps {
  currentRegion?: string
}

export default function RegionSelect({ currentRegion }: RegionSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleRegionChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value === 'all') {
        params.delete('region')
      } else {
        params.set('region', value)
      }

      // Reset to page 1 when filter changes
      params.delete('strona')

      router.push(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="region-select" className="text-sm font-medium">
        Województwo:
      </label>
      <Select value={currentRegion || 'all'} onValueChange={handleRegionChange}>
        <SelectTrigger id="region-select" className="w-full">
          <SelectValue placeholder="Wybierz województwo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Wszystkie</SelectItem>
          {POLISH_PROVINCES.map((province) => (
            <SelectItem key={province.value} value={province.value}>
              {province.label.pl}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
