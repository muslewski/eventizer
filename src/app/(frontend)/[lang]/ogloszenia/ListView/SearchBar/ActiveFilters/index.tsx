'use client'

import { Badge } from '@/components/ui/badge'
import { sortOptionLabels } from '@/app/(frontend)/[lang]/ogloszenia/ListView/utils'
import { useListViewTransition } from '@/app/(frontend)/[lang]/ogloszenia/ListView/TransitionContext'
import type { SortOption } from '@/app/(frontend)/[lang]/ogloszenia/ListView/types'
import { MapPin, ArrowUpDown, DollarSign, Search, Tag, X } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider'

interface ActiveFiltersProps {
  currentSort: SortOption
  currentLat?: number
  currentLng?: number
  currentDistance?: number
  minPrice?: number
  maxPrice?: number
}

export default function ActiveFilters({
  currentSort,
  currentLat,
  currentLng,
  currentDistance,
  minPrice,
  maxPrice,
}: ActiveFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { startTransition } = useListViewTransition()
  const { isLoaded } = useGoogleMaps()

  const currentSearch = searchParams.get('szukaj')
  const currentCategory = searchParams.get('kategoria')

  // Resolve location name from coordinates
  const [locationName, setLocationName] = useState<string | null>(null)
  const prevCoordsRef = useRef<string | null>(null)

  useEffect(() => {
    const coordsKey = currentLat && currentLng ? `${currentLat},${currentLng}` : null

    if (!coordsKey) {
      setLocationName(null)
      prevCoordsRef.current = null
      return
    }

    // Skip if we already resolved this pair
    if (coordsKey === prevCoordsRef.current) return
    prevCoordsRef.current = coordsKey

    if (!isLoaded) return

    const geocoder = new google.maps.Geocoder()
    geocoder.geocode(
      { location: { lat: currentLat!, lng: currentLng! } },
      (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          const locality = results.find((r) => r.types.includes('locality'))
          const name = locality ? locality.formatted_address : results[0].formatted_address
          setLocationName(name.split(',')[0])
        }
      },
    )
  }, [currentLat, currentLng, isLoaded])

  const removeParam = useCallback(
    (...keys: string[]) => {
      const params = new URLSearchParams(searchParams.toString())
      keys.forEach((key) => params.delete(key))
      params.delete('strona')

      const queryString = params.toString()
      startTransition(() => {
        router.push(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false })
      })
    },
    [router, pathname, searchParams, startTransition],
  )

  const hasLocation = currentLat !== undefined && currentLng !== undefined
  const hasPriceMin = minPrice !== undefined && minPrice > 0
  const hasPriceMax = maxPrice !== undefined && maxPrice > 0
  const hasSearch = !!currentSearch
  const hasCategory = !!currentCategory
  const hasNonDefaultSort = currentSort !== 'newest'

  const hasAnyFilter = hasLocation || hasPriceMin || hasPriceMax || hasSearch || hasCategory || hasNonDefaultSort

  if (!hasAnyFilter) return null

  const formatCategoryLabel = (slug: string) => {
    // "kategoria/podkategoria" -> "podkategoria", also deslugify
    const parts = slug.split('/')
    const last = parts[parts.length - 1]
    return last
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }

  return (
    <div className="flex flex-wrap gap-2">
      {hasSearch && (
        <FilterBadge
          icon={<Search className="size-3" />}
          label={`„${currentSearch}"`}
          onRemove={() => removeParam('szukaj')}
        />
      )}

      {hasCategory && (
        <FilterBadge
          icon={<Tag className="size-3" />}
          label={formatCategoryLabel(currentCategory!)}
          onRemove={() => removeParam('kategoria')}
        />
      )}

      {hasLocation && (
        <FilterBadge
          icon={<MapPin className="size-3" />}
          label={`${locationName ?? '...'} · ${currentDistance ?? 50} km`}
          onRemove={() => removeParam('lat', 'lng', 'odleglosc')}
        />
      )}

      {hasNonDefaultSort && (
        <FilterBadge
          icon={<ArrowUpDown className="size-3" />}
          label={sortOptionLabels[currentSort]}
          onRemove={() => removeParam('sortuj')}
        />
      )}

      {(hasPriceMin || hasPriceMax) && (
        <FilterBadge
          icon={<DollarSign className="size-3" />}
          label={formatPriceLabel(minPrice, maxPrice)}
          onRemove={() => removeParam('minCena', 'maxCena')}
        />
      )}
    </div>
  )
}

function formatPriceLabel(min?: number, max?: number) {
  if (min && max) return `${min} – ${max} zł`
  if (min) return `od ${min} zł`
  if (max) return `do ${max} zł`
  return ''
}

function FilterBadge({
  icon,
  label,
  onRemove,
}: {
  icon: React.ReactNode
  label: string
  onRemove: () => void
}) {
  return (
    <Badge
      variant="outline"
      className="gap-1.5 pl-2 pr-1 py-1 text-xs font-normal normal-case tracking-normal cursor-default group"
    >
      {icon}
      <span className="max-w-40 truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10 transition-colors cursor-pointer"
        aria-label={`Usuń filtr: ${label}`}
      >
        <X className="size-3" />
      </button>
    </Badge>
  )
}
