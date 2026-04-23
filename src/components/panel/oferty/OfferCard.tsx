'use client'

import { useState } from 'react'
import { PositionedImage } from '@/components/image-position/PositionedImage'
import type { ImagePosition } from '@/components/image-position/types'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PencilIcon, ExternalLinkIcon, MapPinIcon, ImageIcon } from 'lucide-react'
import { formatOfferPrice } from '@/lib/formatOfferPrice'
import type { Offer } from '@/payload-types'

interface OfferCardProps {
  offer: Offer
  lang: string
}

export function OfferCard({ offer, lang }: OfferCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  const mainImageUrl =
    typeof offer.mainImage === 'object' && offer.mainImage ? offer.mainImage.url : null
  const isPublished = offer._status === 'published'
  const city = typeof offer.location === 'object' ? offer.location?.city : null

  const hasAnyPrice = offer.hasPriceRange
    ? offer.priceFrom != null || offer.priceTo != null
    : offer.price != null
  const priceDisplay = hasAnyPrice ? formatOfferPrice(offer) : null

  return (
    <Card className="group flex flex-col sm:flex-row bg-background border-border/20 overflow-hidden py-0 sm:py-0 gap-0">
      {/* Image */}
      <Link
        href={`/${lang}/panel/oferty/${offer.link}`}
        className="relative w-full sm:w-48 md:w-56 shrink-0 min-h-44 sm:min-h-0 bg-muted/30 overflow-hidden"
      >
        {mainImageUrl && !imageLoaded && (
          <Skeleton className="absolute inset-0 flex items-center justify-center rounded-none">
            <ImageIcon className="size-6 text-muted-foreground/40 animate-pulse" />
          </Skeleton>
        )}
        {mainImageUrl ? (
          <PositionedImage
            src={mainImageUrl}
            alt={offer.title}
            position={typeof offer.mainImage === 'object' ? (offer.mainImage as Partial<ImagePosition>) : null}
            className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
            imgClassName={imageLoaded ? 'opacity-100' : 'opacity-0'}
            sizes="(max-width: 640px) 100vw, 224px"
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="size-8 text-muted-foreground/20" />
          </div>
        )}

        {/* Status badge overlay */}
        <Badge
          variant={isPublished ? 'default' : 'secondary'}
          className="absolute left-2 top-2"
        >
          {isPublished ? 'Opublikowana' : 'Robocza'}
        </Badge>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
        <div className="flex flex-col gap-2">
          {/* Title */}
          <Link href={`/${lang}/panel/oferty/${offer.link}`}>
            <h3 className="font-bebas text-xl sm:text-2xl tracking-wide line-clamp-1 group-hover:text-muted-foreground transition-colors">
              {offer.title}
            </h3>
          </Link>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2">
            {offer.categoryName && (
              <Badge variant="outline" className="text-xs">{offer.categoryName}</Badge>
            )}
            {city && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPinIcon className="size-3" />
                {city}
              </span>
            )}
          </div>

          {/* Short description */}
          {offer.shortDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2">{offer.shortDescription}</p>
          )}
        </div>

        {/* Bottom row: price + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {priceDisplay && (
            <div className="rounded-lg bg-accent/5 border border-accent/20 px-3 py-1.5">
              <span className="font-bebas text-lg tracking-wide text-foreground/75">{priceDisplay}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${lang}/panel/oferty/${offer.link}`}>
                <PencilIcon data-icon="inline-start" />
                Zarządzaj
              </Link>
            </Button>
            {isPublished && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${lang}/ogloszenia/${offer.link}`} target="_blank">
                  <ExternalLinkIcon data-icon="inline-start" />
                  Podgląd
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
