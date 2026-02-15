'use client'

import { useEffect, useRef, useState } from 'react'
import { Offer } from '@/payload-types'
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider'
import { MapPin } from 'lucide-react'
import { motion } from 'motion/react'
import { useTheme } from 'next-themes'
import { BlockHeader } from '@/components/frontend/Content/BlockHeader'

const MAP_ID = '4adcad22af12764877070f55'

interface OfferMapProps {
  offer: Offer
}

export const OfferMap: React.FC<OfferMapProps> = ({ offer }) => {
  const { isLoaded } = useGoogleMaps()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const circleRef = useRef<google.maps.Circle | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const lat = offer.location?.lat
  const lng = offer.location?.lng
  const city = offer.location?.city
  const serviceRadius = offer.location?.serviceRadius ?? 50

  // Don't render if no location coordinates
  if (!lat || !lng) return null

  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return

    const center = { lat, lng }

    // Read accent colors from CSS custom properties so the map follows the theme
    const styles = getComputedStyle(document.documentElement)
    const accentColor = styles.getPropertyValue('--color-brand-500').trim()
    const accentColorDark = styles.getPropertyValue('--color-brand-700').trim()

    // Create map with cloud-based style and native color scheme
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: getZoomForRadius(serviceRadius),
      mapId: MAP_ID,
      colorScheme: isDark ? 'DARK' : 'LIGHT',
      disableDefaultUI: true,
      zoomControl: true,
      scrollwheel: false,
      gestureHandling: 'cooperative',
    })

    mapInstanceRef.current = map

    // Create advanced marker
    const pinElement = new google.maps.marker.PinElement({
      scale: 1.3,
      background: accentColor,
      borderColor: accentColorDark,
      glyphColor: '#ffffff',
    })

    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: center,
      title: city || offer.title,
      content: pinElement.element,
    })

    markerRef.current = marker

    // Create service radius circle
    const circle = new google.maps.Circle({
      map,
      center,
      radius: serviceRadius * 1000, // Convert km to meters
      fillColor: accentColor,
      fillOpacity: 0.08,
      strokeColor: accentColor,
      strokeOpacity: 0.3,
      strokeWeight: 2,
    })

    circleRef.current = circle

    setMapReady(true)

    return () => {
      if (markerRef.current) {
        markerRef.current.map = null
        markerRef.current = null
      }
      if (circleRef.current) {
        circleRef.current.setMap(null)
        circleRef.current = null
      }
      mapInstanceRef.current = null
      setMapReady(false)
    }
  }, [isLoaded, lat, lng, serviceRadius, city, offer.title, isDark])

  // Update color scheme when theme changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return
    mapInstanceRef.current.setOptions({
      colorScheme: isDark ? 'DARK' : 'LIGHT',
    })
  }, [isDark, mapReady])

  // Update map when offer location changes (live preview)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return

    const center = { lat, lng }

    mapInstanceRef.current.setCenter(center)
    mapInstanceRef.current.setZoom(getZoomForRadius(serviceRadius))

    if (markerRef.current) {
      markerRef.current.position = center
    }

    if (circleRef.current) {
      circleRef.current.setCenter(center)
      circleRef.current.setRadius(serviceRadius * 1000)
    }
  }, [lat, lng, serviceRadius, mapReady])

  return (
    <motion.section
      className="w-full flex flex-col items-center gap-5"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <BlockHeader
        heading="Lokalizacja"
        description={`Sprawdź gdzie działa usługodawca. Zasięg usługi wynosi ${serviceRadius} km${city ? ` od ${city}` : ''}.`}
        gap
        grid
        planet
        aurora
      />
      {/* Map container with border and rounded corners */}
      <div className="w-full max-w-5xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-lg">
          {/* Map */}
          <div
            ref={mapRef}
            className="w-full h-[350px] sm:h-[400px] md:h-[450px]"
          />

          {/* Overlay info card */}
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:left-4 sm:bottom-4">
            <div className="bg-background/90 backdrop-blur-md rounded-xl border border-border/50 px-4 py-3 shadow-xl flex items-center gap-3 max-w-xs">
              <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="size-4 text-primary" />
              </div>
              <div className="min-w-0">
                {city && (
                  <p className="text-sm font-medium text-foreground truncate">{city}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Zasięg usługi: {serviceRadius} km
                </p>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {!mapReady && (
            <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Ładowanie mapy...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  )
}

/**
 * Calculate appropriate zoom level based on service radius in km.
 * Larger radius → more zoomed out.
 */
function getZoomForRadius(radiusKm: number): number {
  if (radiusKm <= 5) return 11
  if (radiusKm <= 10) return 10
  if (radiusKm <= 25) return 9
  if (radiusKm <= 50) return 8
  if (radiusKm <= 100) return 7
  if (radiusKm <= 200) return 6
  if (radiusKm <= 300) return 5
  return 4
}
