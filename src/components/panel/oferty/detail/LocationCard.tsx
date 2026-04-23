'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { InfoCardShell } from './InfoCardShell'
import { buildStaticMapUrl } from './staticMapUrl'
import { cn } from '@/lib/utils'

interface LocationCardProps {
  address: string | null | undefined
  city: string | null | undefined
  lat: number | null | undefined
  lng: number | null | undefined
}

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

export function LocationCard({ address, city, lat, lng }: LocationCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const mapUrl = buildStaticMapUrl({ lat, lng, apiKey: MAPS_API_KEY })
  const showMap = mapUrl !== null && !imageFailed

  // When the map backdrop renders we flip title + description colors to stay
  // legible against the dark image. Targets shadcn's data-slot attrs on
  // CardTitle / CardDescription so we don't have to thread className props
  // through InfoCardShell for every child.
  const mapOverrides = showMap
    ? '[&_[data-slot=card-title]]:text-white [&_[data-slot=card-description]]:text-white/75'
    : ''

  return (
    <InfoCardShell
      icon={MapPin}
      title="Lokalizacja"
      description="Skąd świadczysz usługi"
      className={cn('relative isolate', mapOverrides)}
    >
      {showMap && (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
        >
          <img
            src={mapUrl!}
            alt=""
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
        </div>
      )}
      {address ? (
        <div
          className={cn(
            'flex flex-col gap-0.5',
            showMap && 'text-white drop-shadow-md',
          )}
        >
          <span className="text-sm font-medium">{address}</span>
          {city && city !== address && (
            <span
              className={cn(
                'text-xs',
                showMap ? 'text-white/80' : 'text-muted-foreground',
              )}
            >
              {city}
            </span>
          )}
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">Brak lokalizacji</span>
      )}
    </InfoCardShell>
  )
}
