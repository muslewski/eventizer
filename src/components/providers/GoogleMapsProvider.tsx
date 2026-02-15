'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

interface GoogleMapsContextType {
  isLoaded: boolean
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({ isLoaded: false })

export function useGoogleMaps() {
  return useContext(GoogleMapsContext)
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

let loaderPromise: Promise<void> | null = null
let optionsSet = false

function loadGoogleMapsOnce(): Promise<void> {
  if (loaderPromise) return loaderPromise

  if (!GOOGLE_MAPS_API_KEY) {
    console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set')
    return Promise.reject(new Error('Google Maps API key not configured'))
  }

  if (!optionsSet) {
    setOptions({
      key: GOOGLE_MAPS_API_KEY,
      v: 'weekly',
      libraries: ['places', 'maps', 'marker'],
    })
    optionsSet = true
  }

  loaderPromise = Promise.all([
    importLibrary('places'),
    importLibrary('maps'),
    importLibrary('marker'),
  ]).then(() => undefined)
  return loaderPromise
}

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    loadGoogleMapsOnce()
      .then(() => setIsLoaded(true))
      .catch((err) => console.error('Failed to load Google Maps:', err))
  }, [])

  return (
    <GoogleMapsContext.Provider value={{ isLoaded }}>
      {children}
    </GoogleMapsContext.Provider>
  )
}
