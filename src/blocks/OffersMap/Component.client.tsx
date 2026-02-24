'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider'
import { useTheme } from 'next-themes'
import { MapPin, ArrowRight, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { BlockHeader } from '@/components/frontend/Content/BlockHeader'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import Link from 'next/link'
import type { OfferPin } from '@/blocks/OffersMap/Component'

const MAP_ID = '4adcad22af12764877070f55'

// Poland center coordinates
const POLAND_CENTER = { lat: 51.92, lng: 19.15 }
const POLAND_ZOOM = 6

/** Group of pins sharing the same location */
interface PinGroup {
  lat: number
  lng: number
  pins: OfferPin[]
}

interface OffersMapClientProps {
  heading: string
  description: string
  pins: OfferPin[]
  totalOffers: number
  className?: string
}

/** Round coordinates to ~1m precision to group overlapping markers */
function coordKey(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`
}

/** Group pins that share the same (or very close) coordinates */
function groupPinsByLocation(pins: OfferPin[]): PinGroup[] {
  const map = new Map<string, PinGroup>()
  for (const pin of pins) {
    const key = coordKey(pin.lat, pin.lng)
    const existing = map.get(key)
    if (existing) {
      existing.pins.push(pin)
    } else {
      map.set(key, { lat: pin.lat, lng: pin.lng, pins: [pin] })
    }
  }
  return Array.from(map.values())
}

/** Format price for display */
function formatPrice(pin: OfferPin): string {
  if (!pin.hasPriceRange) {
    return `${(pin.price ?? 0).toFixed(0)} zł`
  }
  if (pin.priceFrom != null && pin.priceTo != null) {
    if (pin.priceFrom === pin.priceTo) return `${pin.priceFrom.toFixed(0)} zł`
    return `${pin.priceFrom.toFixed(0)} – ${pin.priceTo.toFixed(0)} zł`
  }
  if (pin.priceFrom != null) return `od ${pin.priceFrom.toFixed(0)} zł`
  if (pin.priceTo != null) return `do ${pin.priceTo.toFixed(0)} zł`
  return ''
}

export const OffersMapClient: React.FC<OffersMapClientProps> = ({
  heading,
  description,
  pins,
  totalOffers,
  className,
}) => {
  const { isLoaded } = useGoogleMaps()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<PinGroup | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mainImageLoaded, setMainImageLoaded] = useState(false)
  const [iconLoaded, setIconLoaded] = useState(false)

  // The currently displayed pin in the info card
  const selectedPin = selectedGroup ? selectedGroup.pins[selectedIndex] ?? null : null

  // Group pins by location
  const pinGroups = useMemo(() => groupPinsByLocation(pins), [pins])

  // Cleanup markers helper
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => {
      marker.map = null
    })
    markersRef.current = []
  }, [])

  // Close info card
  const closeInfoCard = useCallback(() => {
    setSelectedGroup(null)
    setSelectedIndex(0)
    setMainImageLoaded(false)
    setIconLoaded(false)
    infoWindowRef.current?.close()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return

    const map = new google.maps.Map(mapRef.current, {
      center: POLAND_CENTER,
      zoom: POLAND_ZOOM,
      mapId: MAP_ID,
      colorScheme: isDark ? 'DARK' : 'LIGHT',
      disableDefaultUI: true,
      zoomControl: true,
      scrollwheel: false,
      gestureHandling: 'cooperative',
      minZoom: 5,
      maxZoom: 15,
    })

    mapInstanceRef.current = map

    // Close info card when clicking on map background
    map.addListener('click', () => {
      closeInfoCard()
    })

    // Read accent color from CSS custom properties
    const styles = getComputedStyle(document.documentElement)
    const accentColor = styles.getPropertyValue('--color-brand-500').trim()
    const accentColorDark = styles.getPropertyValue('--color-brand-700').trim()

    // Create one marker per location group
    const newMarkers: google.maps.marker.AdvancedMarkerElement[] = []

    for (const group of pinGroups) {
      const count = group.pins.length
      let content: HTMLElement

      if (count > 1) {
        // Badge marker showing the number of offers at this location
        const wrapper = document.createElement('div')
        wrapper.style.position = 'relative'
        wrapper.style.cursor = 'pointer'

        const pinEl = new google.maps.marker.PinElement({
          scale: 1,
          background: accentColor,
          borderColor: accentColorDark,
          glyphColor: '#ffffff',
        })
        wrapper.appendChild(pinEl.element)

        const badge = document.createElement('div')
        badge.textContent = String(count)
        badge.style.cssText = `
          position: absolute; top: -6px; right: -10px;
          background: ${accentColorDark}; color: #fff;
          font-size: 11px; font-weight: 700;
          min-width: 20px; height: 20px;
          border-radius: 10px; display: flex;
          align-items: center; justify-content: center;
          padding: 0 5px; border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          pointer-events: none; z-index: 1;
        `
        wrapper.appendChild(badge)
        content = wrapper
      } else {
        const pinEl = new google.maps.marker.PinElement({
          scale: 0.8,
          background: accentColor,
          borderColor: accentColorDark,
          glyphColor: '#ffffff',
        })
        content = pinEl.element
      }

      const firstPin = group.pins[0]
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: group.lat, lng: group.lng },
        title:
          count > 1
            ? `${count} ofert — ${firstPin.city ?? ''}`
            : firstPin.city
              ? `${firstPin.title} — ${firstPin.city}`
              : firstPin.title,
        content,
      })

      // Click handler — select this group
      marker.addListener('gmp-click', () => {
        setMainImageLoaded(false)
        setIconLoaded(false)
        setSelectedIndex(0)
        setSelectedGroup(group)

        // Smoothly pan to the pin
        map.panTo({ lat: group.lat, lng: group.lng })
      })

      newMarkers.push(marker)
    }

    markersRef.current = newMarkers
    setMapReady(true)

    return () => {
      clearMarkers()
      mapInstanceRef.current = null
      setMapReady(false)
    }
  }, [isLoaded, pinGroups, isDark, clearMarkers, closeInfoCard])

  // Update color scheme when theme changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return
    mapInstanceRef.current.setOptions({
      colorScheme: isDark ? 'DARK' : 'LIGHT',
    })
  }, [isDark, mapReady])

  // Format number with space separator (Polish style)
  const formatNumber = (n: number) => n.toLocaleString('pl-PL')

  return (
    <motion.section
      className="w-full flex flex-col items-center gap-8"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <BlockHeader
        heading={heading}
        description={description}
        badge={{ label: `${formatNumber(totalOffers)} ofert`, variant: 'default' }}
        lines
        grid
        planet
        aurora
      />

      {/* Map container */}
      <div className="w-full max-w-6xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-lg">
          {/* Map */}
          <div ref={mapRef} className="w-full h-[400px] sm:h-[500px] md:h-[550px]" />

          {/* Selected offer info card */}
          <AnimatePresence>
            {selectedPin && (
              <motion.div
                key={`${selectedPin.id}-${selectedIndex}`}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="absolute top-4 right-4 z-10 w-72 sm:w-80"
              >
                <div className="bg-background/50 backdrop-blur-md rounded-2xl border border-border/60 shadow-[inset_0_2px_6px_rgba(0,0,0,0.2),0_4px_16px_rgba(0,0,0,0.15)] overflow-hidden">
                  {/* Close button */}
                  <button
                    onClick={closeInfoCard}
                    className="absolute top-2 right-2 z-20 size-7 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
                  >
                    <X className="size-3.5 text-muted-foreground" />
                  </button>

                  {/* Group navigation (prev / next) */}
                  {selectedGroup && selectedGroup.pins.length > 1 && (
                    <div className="absolute top-2 left-2 z-20 flex items-center gap-1">
                      <button
                        onClick={() => {
                          setMainImageLoaded(false)
                          setIconLoaded(false)
                          setSelectedIndex(
                            (prev) =>
                              (prev - 1 + selectedGroup.pins.length) % selectedGroup.pins.length,
                          )
                        }}
                        className="size-7 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="size-3.5 text-muted-foreground" />
                      </button>
                      <span className="text-[11px] font-medium text-white bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 tabular-nums">
                        {selectedIndex + 1}/{selectedGroup.pins.length}
                      </span>
                      <button
                        onClick={() => {
                          setMainImageLoaded(false)
                          setIconLoaded(false)
                          setSelectedIndex(
                            (prev) => (prev + 1) % selectedGroup.pins.length,
                          )
                        }}
                        className="size-7 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
                      >
                        <ChevronRight className="size-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  )}

                  {/* Main image as rounded header */}
                  {selectedPin.mainImageUrl && (
                    <div className="relative w-full h-32 overflow-hidden">
                      {!mainImageLoaded && (
                        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
                      )}
                      <Image
                        src={selectedPin.mainImageUrl}
                        alt={selectedPin.title}
                        fill
                        className={`object-cover transition-opacity duration-300 ${mainImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        sizes="320px"
                        onLoad={() => setMainImageLoaded(true)}
                      />
                      {/* Gradient overlay for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

                      {/* Category icon badge over image */}
                      {selectedPin.categoryIconUrl && (
                        <div className="absolute bottom-2 left-3">
                          <div className="size-16 rounded-full bg-background/50 backdrop-blur-md border border-border/50 flex items-center justify-center shadow-[inset_0_2px_6px_rgba(0,0,0,0.25),0_2px_8px_rgba(0,0,0,0.15)] p-3">
                            {!iconLoaded && (
                              <Skeleton className="absolute inset-3 rounded-full" />
                            )}
                            <Image
                              src={selectedPin.categoryIconUrl}
                              alt={selectedPin.categoryName ?? 'Kategoria'}
                              width={40}
                              height={40}
                              className={`object-contain dark:invert transition-opacity duration-300 ${iconLoaded ? 'opacity-100' : 'opacity-0'}`}
                              onLoad={() => setIconLoaded(true)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="px-4 pt-3 pb-4 flex flex-col gap-2">
                    {/* Title */}
                    <h3 className="font-bebas text-xl leading-tight text-foreground line-clamp-2">
                      {selectedPin.title}
                    </h3>

                    {/* Category & Location */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {selectedPin.categoryName && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
                          {/* Show deepest category only */}
                          {selectedPin.categoryName.includes('→')
                            ? selectedPin.categoryName.split('→').pop()?.trim()
                            : selectedPin.categoryName}
                        </span>
                      )}
                      {selectedPin.city && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
                          <MapPin className="size-2.5" />
                          {selectedPin.city}
                        </span>
                      )}
                    </div>

                    {/* Short description */}
                    {selectedPin.shortDescription && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {selectedPin.shortDescription}
                      </p>
                    )}

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-semibold text-foreground">
                        {formatPrice(selectedPin)}
                      </span>

                      <Link
                        href={`/ogloszenia/${selectedPin.link}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Zobacz
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats overlay */}
          <div className="absolute bottom-4 left-4 right-4 right-auto sm:left-4 sm:bottom-4">
            <div className="bg-background/90 backdrop-blur-md rounded-xl border border-border/50 px-4 py-3 shadow-xl flex items-center gap-3 max-w-xs">
              <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="size-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {formatNumber(totalOffers)} ofert na mapie
                </p>
                <p className="text-xs text-muted-foreground">Cała Polska</p>
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
