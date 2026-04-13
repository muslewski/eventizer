'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { MapPinIcon } from 'lucide-react'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

export interface PlaceResult {
  address: string
  city: string
  lat: number
  lng: number
  placeId: string
}

interface LocationPickerProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (result: PlaceResult) => void
  city?: string
  lat?: number
  lng?: number
  placeholder?: string
  disabled?: boolean
  'aria-invalid'?: boolean
}

function extractCity(addressComponents: google.maps.GeocoderAddressComponent[]): string {
  const cityComponent = addressComponents.find((c) => c.types.includes('locality'))
  if (cityComponent) return cityComponent.long_name

  const adminArea3 = addressComponents.find((c) => c.types.includes('administrative_area_level_3'))
  if (adminArea3) return adminArea3.long_name

  const adminArea2 = addressComponents.find((c) => c.types.includes('administrative_area_level_2'))
  if (adminArea2) return adminArea2.long_name

  return ''
}

export function LocationPicker({
  value,
  onChange,
  onPlaceSelect,
  city,
  lat,
  lng,
  placeholder = 'Wpisz adres lub miasto...',
  disabled,
  'aria-invalid': ariaInvalid,
}: LocationPickerProps) {
  const [inputValue, setInputValue] = useState(value || '')
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mapsLoaded, setMapsLoaded] = useState(false)

  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync external value
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Load Google Maps API
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return

    setOptions({ key: GOOGLE_MAPS_API_KEY, v: 'weekly', libraries: ['places'] })

    importLibrary('places')
      .then(() => {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
        const div = document.createElement('div')
        placesServiceRef.current = new google.maps.places.PlacesService(div)
        setMapsLoaded(true)
      })
      .catch((err: unknown) => {
        console.error('Failed to load Google Maps:', err)
      })
  }, [])

  // Close on outside click
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
    if (!autocompleteServiceRef.current || input.length < 3) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    autocompleteServiceRef.current.getPlacePredictions(
      { input, componentRestrictions: { country: 'pl' }, types: ['geocode'] },
      (predictions, status) => {
        setIsLoading(false)
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
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
      const val = e.target.value
      setInputValue(val)
      onChange(val)

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => fetchSuggestions(val), 300)
    },
    [onChange, fetchSuggestions],
  )

  const handleSelectPlace = useCallback(
    (prediction: google.maps.places.AutocompletePrediction) => {
      if (!placesServiceRef.current) return

      setShowSuggestions(false)
      setIsLoading(true)

      placesServiceRef.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ['formatted_address', 'geometry', 'address_components', 'place_id'],
        },
        (place, status) => {
          setIsLoading(false)
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            const result: PlaceResult = {
              address: place.formatted_address || prediction.description,
              city: extractCity(place.address_components || []),
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              placeId: place.place_id || prediction.place_id,
            }

            setInputValue(result.address)
            onChange(result.address)
            onPlaceSelect(result)
          }
        },
      )
    },
    [onChange, onPlaceSelect],
  )

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder={mapsLoaded ? placeholder : 'Ładowanie Google Maps...'}
          disabled={disabled || !mapsLoaded}
          aria-invalid={ariaInvalid}
          className="pr-8"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner className="size-4" />
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          {suggestions.map((prediction) => (
            <li
              key={prediction.place_id}
              onClick={() => handleSelectPlace(prediction)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSelectPlace(prediction) }}
              role="option"
              tabIndex={0}
              aria-selected={false}
              className="cursor-pointer border-b border-border/50 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-accent/5"
            >
              <div className="text-sm font-medium">
                {prediction.structured_formatting.main_text}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {prediction.structured_formatting.secondary_text}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Location info badges */}
      {(city || (lat && lng)) && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {city && (
            <Badge variant="outline" className="gap-1 text-xs">
              <MapPinIcon className="size-3" />
              {city}
            </Badge>
          )}
          {lat && lng && (
            <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
              {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
