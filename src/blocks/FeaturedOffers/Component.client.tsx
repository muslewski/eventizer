'use client'

import { Offer } from '@/payload-types'

import { TitleH2 } from '@/components/frontend/Content/TitleH2'
import { Badge } from '@/components/ui/badge'
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
      <div className="flex flex-col gap-16 relative">
        {/* Decorative accent bottom center */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-linear-to-r from-transparent via-accent blur-md to-transparent rounded-full" />
        {/* <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-1 bg-linear-to-r from-transparent via-stone-400 blur-md to-transparent rounded-full" /> */}

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

        {/* Line */}
        <div className="bg-linear-to-r from-accent dark:from-accent/50 via-transparent to-transparent h-px w-[calc(100%+4rem)] -ml-8" />

        {/* Header of Featured Offers */}
        <div className="text-center flex flex-col items-center gap-6">
          <Badge variant="golden">Wyróżnione Oferty</Badge>
          <div className="flex flex-col items-center">
            <TitleH2 align="center" title={heading} />
            <p>{description}</p>
          </div>
        </div>

        {/* Line */}
        <div className="bg-linear-to-l from-accent dark:from-accent/40 via-transparent to-transparent h-px w-[calc(100%+4rem)] -ml-8" />

        {/* Corner accents */}
        <div className="absolute top-0 right-0 w-8 h-8 border-r border-t border-accent/20" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-l border-b border-accent/20" />
      </div>

      {/* Carousel of Featured Offers */}
      <div className="w-full flex items-center justify-center relative">
        <OffersCarousel offers={offers} />
      </div>
    </div>
  )
}
