'use client'

import { Card, CardFooter, CardHeader } from '@/components/ui/card'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { CMSLink } from '@/components/payload/Link'

export interface CarouselSlide {
  /** Unique identifier for the slide */
  id: string
  /** Image URL to display */
  imageUrl: string
  /** Alt text for the image */
  imageAlt: string
  /** Optional badge text (e.g. category label) */
  badge?: string | null
  /** Optional label/title displayed on the card */
  label?: string | null
  /** Optional link configuration */
  link?: {
    url: string
    /** CTA button text — if omitted, the CTA button is hidden */
    ctaLabel?: string
  } | null
}

interface CarouselCardProps {
  slide: CarouselSlide
  isActive: boolean
  /** Optional click handler — when set, the card becomes clickable */
  onClick?: () => void
}

export default function CarouselCard({ slide, isActive, onClick }: CarouselCardProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <Card
      className={cn(
        'bg-transparent rounded-xl h-80 sm:h-96 md:h-124 relative overflow-hidden group/carousel-card isolate will-change-transform transform-gpu duration-500 transition-all',
        isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-90 dark:opacity-70',
        onClick && 'cursor-pointer',
      )}
      onClick={onClick}
    >
      {/* Image wrapper */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-xl">
        {!isLoaded && <Skeleton className="absolute inset-0 w-full h-full rounded-xl" />}
        <Image
          src={slide.imageUrl}
          alt={slide.imageAlt}
          fill
          priority={isActive}
          sizes="(max-width: 768px) 66vw, (max-width: 1280px) 50vw, 33vw"
          onLoad={() => setIsLoaded(true)}
          className={cn(
            'object-cover transition-all duration-500 ease-out transform-gpu group-hover/carousel-card:scale-110 group-hover/carousel-card:rotate-2 group-hover/carousel-card:contrast-110 group-hover/carousel-card:hue-rotate-[-12deg]',
            isLoaded ? 'opacity-100 zoom-in' : 'opacity-0',
          )}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 z-0 bg-linear-to-t dark:from-background/80 via-background/20 to-transparent" />
        <div className="absolute inset-0 z-0 bg-linear-to-br from-transparent via-transparent to-background/40" />
      </div>

      <CardHeader>
        {slide.badge && <Badge variant="default">{slide.badge}</Badge>}
        {slide.label &&
          (slide.link ? (
            <Link
              href={slide.link.url}
              onClick={() => window.scrollTo(0, 0)}
              prefetch={true}
              className="font-bebas mix-blend-overlay text-2xl sm:text-3xl lg:text-4xl xl:text-5xl hover:scale-105 transition-transform duration-300"
            >
              {slide.label}
            </Link>
          ) : (
            <span className="font-bebas mix-blend-overlay text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">
              {slide.label}
            </span>
          ))}
      </CardHeader>

      {slide.link?.ctaLabel && (
        <CardFooter className="absolute bottom-6 left-0">
      
           <CMSLink
          type="custom"
          url={slide.link.url}
          appearance="cta"
          size="sm"
          prefetch={true}
          onClick={() => window.scrollTo(0, 0)}
        >
            {slide.link.ctaLabel}
        </CMSLink>
        </CardFooter>
      )}
    </Card>
  )
}
