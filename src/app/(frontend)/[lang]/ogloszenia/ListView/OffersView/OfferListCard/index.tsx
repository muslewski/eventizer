'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ImageIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface OfferListCardProps {
  title: string
  description: string
  categoryName?: string
  city?: string
  priceMin: number
  priceMax: number
  price?: number
  hasPriceRange?: boolean
  imageUrl?: string
  slug: string
}

export const OfferListCard = ({
  title,
  description,
  categoryName,
  city,
  priceMin,
  priceMax,
  price,
  hasPriceRange,
  imageUrl,
  slug,
}: OfferListCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false)

  const formatPrice = () => {
    // Single price offer
    if (!hasPriceRange) {
      return `${(price ?? 0).toFixed(2)} zł`
    }

    // Price range offer
    if (priceMin === priceMax) {
      return `${priceMin.toFixed(2)} zł`
    }
    return `${priceMin.toFixed(2)} zł - ${priceMax.toFixed(2)} zł`
  }

  return (
    <Card className="w-full flex xl:flex-row flex-col py-0 sm:py-0 min-h-120 sm:min-h-130 xl:min-h-48  items-center bg-transparent bg-linear-to-r from-stone-200 dark:from-stone-900/60 to-background/35 rounded-2xl overflow-hidden">
      <Link
        href={`/ogloszenia/${slug}`}
        className="w-full xl:max-w-3xs h-full bottom-0 top-0 rounded-2xl bg-white/10 relative overflow-hidden min-h-64 md:min-h-80 xl:min-h-48"
      >
        {/* Skeleton + icon shown until image loads */}
        {imageUrl && !imageLoaded && (
          <Skeleton className="absolute inset-0 w-full h-full rounded-none flex items-center justify-center">
            <ImageIcon className="size-8 text-muted-foreground/40 animate-pulse" />
          </Skeleton>
        )}
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className={`object-cover hover:scale-105 transition-all duration-300 ease-in-out ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
        )}
        {!imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
            <ImageIcon className="size-8 text-muted-foreground/30" />
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="xl:pb-6 xl:pt-6 sm:pb-6 sm:pt-0 pb-6 pt-6 flex flex-col xl:flex-row gap-8  justify-between  w-full min-w-0 px-6 xl:px-0 xl:pr-6">
        <div className="w-full min-w-0 flex flex-col gap-2 overflow-hidden">
          {/* Title */}
          <Link
            href={`/ogloszenia/${slug}`}
            className="block min-w-0 overflow-hidden font-bebas text-3xl sm:text-4xl leading-[0.95] text-foreground line-clamp-2 xl:line-clamp-1 hover:text-muted-foreground transition-colors"
          >
            {title}
          </Link>

          <p className="line-clamp-3 xl:line-clamp-2 w-full">{description}</p>

          {(categoryName || city) && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {categoryName ? (
                <span className="inline-flex items-center rounded-md border px-2 py-1 bg-background">
                  {categoryName.includes('→')
                    ? categoryName.split('→').pop()?.trim()
                    : categoryName}
                </span>
              ) : null}

              {city ? (
                <span className="inline-flex items-center rounded-md border px-2 py-1 bg-background">
                  📍 {city}
                </span>
              ) : null}
            </div>
          )}
        </div>
        <CardDescription className="flex flex-row gap-3 flex-wrap xl:flex-col items-start xl:items-end justify-between w-full lg:w-fit">
          <div className="px-4 py-2.5 rounded-xl bg-background/80 border border-border/50 backdrop-blur-sm">
            <div className="font-bebas text-xl sm:text-2xl text-foreground/75 whitespace-nowrap leading-tight tracking-wide">
              {formatPrice()}
            </div>
          </div>

          {/* View button */}
          <Button asChild variant="secondary">
            <Link href={`/ogloszenia/${slug}`}>Sprawdź</Link>
          </Button>
        </CardDescription>
      </div>
    </Card>
  )
}
