'use client'

import { Offer } from '@/payload-types'

import { BlockHeader } from '@/components/frontend/Content/BlockHeader'
import OffersCarousel from '@/blocks/FeaturedOffers/Carousel/index'

interface FeaturedOffersClientProps {
  heading: string
  description: string
  offers: Offer[]
  className?: string
}

export const FeaturedOffersClient: React.FC<FeaturedOffersClientProps> = ({
  heading,
  description,
  offers,
  className,
}) => {
  return (
    <div className="flex flex-col gap-16 -px-4 sm:px-8 -ml-4 sm:-ml-8 w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] bg-linear-to-b from-background dark:via-black/25 to-background">
      {/* Top of Featured Offers */}
      <BlockHeader
        heading={heading}
        description={description}
        badge={{ label: 'Wyróżnione Oferty', variant: 'golden' }}
        lines
      >
        {/* Decorative accent bottom center */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-linear-to-r from-transparent via-accent blur-md to-transparent rounded-full" />

        {/* Decorative scroll indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          <div className="w-3 h-3 border-b-2 border-r-2 border-accent/60 rotate-45" />
          <div className="w-2 h-2 border-b-2 border-r-2 border-accent/40 rotate-45" />
        </div>

        {/* Decorative scroll indicator */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-px h-4 bg-linear-to-b from-accent dark:from-accent/60 to-transparent" />
          <div className="w-2 h-2 rotate-45 border border-accent/60 mt-1" />
        </div>
      </BlockHeader>

      {/* Carousel of Featured Offers */}
      <div className="w-full flex items-center justify-center relative">
        <OffersCarousel offers={offers} />
      </div>
    </div>
  )
}
