'use client'

import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'

interface PriceRangeInputsProps {
  minPrice?: number
  maxPrice?: number
}

export default function PriceRangeInputs({ minPrice, maxPrice }: PriceRangeInputsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read from URL params directly
  const minFromUrl = searchParams.get('minCena') ?? ''
  const maxFromUrl = searchParams.get('maxCena') ?? ''

  const [min, setMin] = useState(minFromUrl)
  const [max, setMax] = useState(maxFromUrl)

  // Sync with URL when it changes externally
  useEffect(() => {
    setMin(minFromUrl)
  }, [minFromUrl])

  useEffect(() => {
    setMax(maxFromUrl)
  }, [maxFromUrl])

  const updateParams = useCallback(
    (minValue: string, maxValue: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (minValue) {
        params.set('minCena', minValue)
      } else {
        params.delete('minCena')
      }

      if (maxValue) {
        params.set('maxCena', maxValue)
      } else {
        params.delete('maxCena')
      }

      // Reset to page 1 when filters change
      params.delete('strona')

      router.push(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMin(value)
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMax(value)
  }

  const handleBlur = () => {
    updateParams(min, max)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateParams(min, max)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Zakres cen (zł):</label>
      <div className="flex gap-2 items-center">
        <Input
          type="number"
          placeholder="Od"
          value={min}
          onChange={handleMinChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          min={0}
          className="w-full"
        />
        <span className="text-muted-foreground">—</span>
        <Input
          type="number"
          placeholder="Do"
          value={max}
          onChange={handleMaxChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          min={0}
          className="w-full"
        />
      </div>
    </div>
  )
}
