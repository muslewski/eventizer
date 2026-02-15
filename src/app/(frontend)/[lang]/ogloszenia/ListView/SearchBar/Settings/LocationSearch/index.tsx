'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MapPin, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider'

const DISTANCE_OPTIONS = [
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
  { value: '100', label: '100 km' },
  { value: '200', label: '200 km' },
]

interface LocationSearchProps {
  currentLat?: number
  currentLng?: number
  currentDistance?: number
}

export default function LocationSearch({
  currentLat,
  currentLng,
  currentDistance,
}: LocationSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const { isLoaded } = useGoogleMaps()

  const [inputValue, setInputValue] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [suggestions, setSuggestions] =
    useState<google.maps.places.AutocompletePrediction[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isClearingRef = useRef(false)

  // Initialize services when Google Maps is loaded
  useEffect(() => {
    if (isLoaded && !autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
      const div = document.createElement('div')
      placesServiceRef.current = new google.maps.places.PlacesService(div)
    }
  }, [isLoaded])

  // Reverse-geocode current coordinates to show location name
  useEffect(() => {
    if (currentLat && currentLng && isLoaded && !selectedLocation && !isClearingRef.current) {
      const geocoder = new google.maps.Geocoder()
      geocoder.geocode(
        { location: { lat: currentLat, lng: currentLng } },
        (results, status) => {
          if (isClearingRef.current) return
          if (status === 'OK' && results && results.length > 0) {
            // Find a locality result
            const locality = results.find((r) =>
              r.types.includes('locality'),
            )
            const name = locality
              ? locality.formatted_address
              : results[0].formatted_address
            setSelectedLocation(name.split(',')[0]) // Just city name
          }
        },
      )
    }
    // Reset clearing flag once lat/lng are actually gone
    if (!currentLat && !currentLng) {
      isClearingRef.current = false
    }
  }, [currentLat, currentLng, isLoaded, selectedLocation])

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = useCallback((input: string) => {
    if (!autocompleteServiceRef.current || input.length < 2) {
      setSuggestions([])
      return
    }

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: 'pl' },
        types: ['(cities)'],
      },
      (predictions, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          predictions
        ) {
          setSuggestions(predictions)
          setShowSuggestions(true)
        } else {
          setSuggestions([])
        }
      },
    )
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setInputValue(value)

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(value)
      }, 300)
    },
    [fetchSuggestions],
  )

  const applyLocationParams = useCallback(
    (lat: number, lng: number, distance: number, locationName: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('lat', lat.toFixed(6))
      params.set('lng', lng.toFixed(6))
      params.set('odleglosc', distance.toString())
      params.delete('strona') // Reset to page 1

      setSelectedLocation(locationName)
      setInputValue('')
      setShowSuggestions(false)

      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false })
      })
    },
    [router, searchParams],
  )

  const handleSelectPlace = useCallback(
    (prediction: google.maps.places.AutocompletePrediction) => {
      if (!placesServiceRef.current) return

      placesServiceRef.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ['geometry', 'formatted_address', 'name'],
        },
        (place, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            place?.geometry?.location
          ) {
            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()
            const distance = currentDistance || 50
            const name = place.name || prediction.structured_formatting.main_text

            applyLocationParams(lat, lng, distance, name)
          }
        },
      )
    },
    [currentDistance, applyLocationParams],
  )

  const handleDistanceChange = useCallback(
    (value: string) => {
      if (currentLat && currentLng) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('odleglosc', value)
        params.delete('strona')

        startTransition(() => {
          router.push(`?${params.toString()}`, { scroll: false })
        })
      }
    },
    [router, searchParams, currentLat, currentLng],
  )

  const handleClearLocation = useCallback(() => {
    isClearingRef.current = true

    const params = new URLSearchParams(searchParams.toString())
    params.delete('lat')
    params.delete('lng')
    params.delete('odleglosc')
    params.delete('strona')

    setSelectedLocation(null)
    setInputValue('')

    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false })
    })
  }, [router, searchParams])

  const hasActiveLocation = currentLat !== undefined && currentLng !== undefined

  return (
    <div className="flex flex-col gap-2" ref={containerRef}>
      <label className="text-sm font-medium">Lokalizacja:</label>

      {/* Selected location display */}
      {hasActiveLocation && selectedLocation && (
        <div className="flex items-center gap-2 text-sm bg-primary/10 rounded-lg px-3 py-2">
          <MapPin className="size-3.5 text-primary shrink-0" />
          <span className="truncate flex-1">{selectedLocation}</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-5 rounded-full"
            onClick={handleClearLocation}
            disabled={isPending}
          >
            <X className="size-3" />
          </Button>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Input
          placeholder={
            isLoaded ? 'Wyszukaj miasto...' : 'Ładowanie...'
          }
          value={inputValue}
          onChange={handleInputChange}
          disabled={!isLoaded || isPending}
          className={cn(
            'w-full transition-opacity',
            isPending && 'opacity-50',
          )}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true)
          }}
        />

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((prediction) => (
              <li
                key={prediction.place_id}
                onClick={() => handleSelectPlace(prediction)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSelectPlace(prediction)
                }}
                role="option"
                tabIndex={0}
                aria-selected={false}
                className="px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors text-sm border-b border-border/50 last:border-0"
              >
                <div className="font-medium">
                  {prediction.structured_formatting.main_text}
                </div>
                <div className="text-xs text-muted-foreground">
                  {prediction.structured_formatting.secondary_text}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Distance select */}
      {hasActiveLocation && (
        <div className="flex flex-col gap-1.5 mt-1">
          <label className="text-xs text-muted-foreground">Odległość:</label>
          <Select
            value={String(currentDistance || 50)}
            onValueChange={handleDistanceChange}
            disabled={isPending}
          >
            <SelectTrigger
              className={cn(
                'w-full transition-opacity',
                isPending && 'opacity-50',
              )}
            >
              <SelectValue placeholder="Odległość" />
            </SelectTrigger>
            <SelectContent>
              {DISTANCE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
