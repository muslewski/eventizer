'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useField, FieldLabel, TextInput } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

interface PlaceResult {
  address: string
  city: string
  lat: number
  lng: number
  placeId: string
}

function extractCity(addressComponents: google.maps.GeocoderAddressComponent[]): string {
  // Try to find city from address components
  const cityComponent = addressComponents.find((c) =>
    c.types.includes('locality'),
  )
  if (cityComponent) return cityComponent.long_name

  // Fallback to administrative area level 3 (gmina)
  const adminArea3 = addressComponents.find((c) =>
    c.types.includes('administrative_area_level_3'),
  )
  if (adminArea3) return adminArea3.long_name

  // Fallback to administrative area level 2
  const adminArea2 = addressComponents.find((c) =>
    c.types.includes('administrative_area_level_2'),
  )
  if (adminArea2) return adminArea2.long_name

  return ''
}

export const LocationPicker: TextFieldClientComponent = (props) => {
  const { path, field, readOnly } = props
  const parentPath = path.replace(/\.address$/, '')

  const addressField = useField<string>({ path: `${parentPath}.address` })
  const cityField = useField<string>({ path: `${parentPath}.city` })
  const latField = useField<number>({ path: `${parentPath}.lat` })
  const lngField = useField<number>({ path: `${parentPath}.lng` })
  const placeIdField = useField<string>({ path: `${parentPath}.placeId` })

  const [inputValue, setInputValue] = useState(addressField.value || '')
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mapsLoaded, setMapsLoaded] = useState(false)

  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load Google Maps API
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set')
      return
    }

    setOptions({
      key: GOOGLE_MAPS_API_KEY,
      v: 'weekly',
      libraries: ['places'],
    })

    importLibrary('places')
      .then(() => {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
        // PlacesService requires a DOM element or map
        const div = document.createElement('div')
        placesServiceRef.current = new google.maps.places.PlacesService(div)
        setMapsLoaded(true)
      })
      .catch((err: unknown) => {
        console.error('Failed to load Google Maps:', err)
      })
  }, [])

  // Sync external value changes
  useEffect(() => {
    if (addressField.value !== undefined && addressField.value !== inputValue) {
      setInputValue(addressField.value || '')
    }
    // Only sync when addressField.value changes from outside
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressField.value])

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

  const fetchSuggestions = useCallback(
    (input: string) => {
      if (!autocompleteServiceRef.current || input.length < 3) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: 'pl' },
          types: ['address'],
        },
        (predictions, status) => {
          setIsLoading(false)
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
    },
    [],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setInputValue(value)
      addressField.setValue(value)

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(value)
      }, 300)
    },
    [addressField, fetchSuggestions],
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
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            place?.geometry?.location
          ) {
            const result: PlaceResult = {
              address: place.formatted_address || prediction.description,
              city: extractCity(place.address_components || []),
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              placeId: place.place_id || prediction.place_id,
            }

            setInputValue(result.address)
            addressField.setValue(result.address)
            cityField.setValue(result.city)
            latField.setValue(result.lat)
            lngField.setValue(result.lng)
            placeIdField.setValue(result.placeId)
          }
        },
      )
    },
    [addressField, cityField, latField, lngField, placeIdField],
  )

  const coordinatesText =
    latField.value && lngField.value
      ? `${Number(latField.value).toFixed(6)}, ${Number(lngField.value).toFixed(6)}`
      : null

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <FieldLabel
        label={field.label || 'Address'}
        required={field.required}
        path={path}
      />

      <div style={{ position: 'relative' }}>
        <TextInput
          path={path}
          value={inputValue}
          onChange={handleInputChange}
          readOnly={readOnly || !mapsLoaded}
          placeholder={
            mapsLoaded
              ? 'Wpisz adres, aby wyszukać...'
              : 'Ładowanie Google Maps...'
          }
          showError={addressField.showError}
        />

        {isLoading && (
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '12px',
              color: 'var(--theme-elevation-500)',
            }}
          >
            ...
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            zIndex: 1000,
            width: '100%',
            backgroundColor: 'var(--theme-elevation-50)',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: '4px',
            marginTop: '4px',
            padding: 0,
            listStyle: 'none',
            maxHeight: '250px',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
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
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '14px',
                borderBottom: '1px solid var(--theme-elevation-100)',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                ;(e.target as HTMLElement).style.backgroundColor =
                  'var(--theme-elevation-100)'
              }}
              onMouseLeave={(e) => {
                ;(e.target as HTMLElement).style.backgroundColor = 'transparent'
              }}
            >
              <div style={{ fontWeight: 500 }}>
                {prediction.structured_formatting.main_text}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--theme-elevation-500)',
                  marginTop: '2px',
                }}
              >
                {prediction.structured_formatting.secondary_text}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Info display */}
      {(cityField.value || coordinatesText) && (
        <div
          style={{
            marginTop: '8px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '13px',
            color: 'var(--theme-elevation-500)',
          }}
        >
          {cityField.value && (
            <span>
              📍 {cityField.value}
            </span>
          )}
          {coordinatesText && (
            <span>
              🌐 {coordinatesText}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default LocationPicker
