'use client'

import { useState, useEffect, useRef } from 'react'

interface UseReverseGeocodeProps {
  lat: number | null | undefined
  lng: number | null | undefined
  isLoaded: boolean
}

export function useReverseGeocode({ lat, lng, isLoaded }: UseReverseGeocodeProps) {
  const [locationName, setLocationName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const cacheRef = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    if (!lat || !lng || !isLoaded) {
      setLocationName(null)
      return
    }

    const coordsKey = `${lat},${lng}`
    const cached = cacheRef.current.get(coordsKey)
    if (cached) {
      setLocationName(cached)
      return
    }

    setIsLoading(true)
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results.length > 0) {
        const locality = results.find((r) => r.types.includes('locality'))
        const name = locality ? locality.formatted_address : results[0].formatted_address
        const shortName = name.split(',')[0]
        cacheRef.current.set(coordsKey, shortName)
        setLocationName(shortName)
      }
      setIsLoading(false)
    })
  }, [lat, lng, isLoaded])

  return { locationName, isLoading }
}
