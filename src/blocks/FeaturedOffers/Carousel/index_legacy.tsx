'use client'

import { Offer, OfferUpload } from '@/payload-types'

import { isExpandedDoc } from '@/lib/isExpandedDoc'
import Image from 'next/image'
import { CMSLink } from '@/components/payload/Link'

import Autoplay from 'embla-carousel-autoplay'

import { Card, CardFooter, CardHeader } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Badge } from '@/components/ui/badge'

const AUTOPLAY_DELAY = 4000

/**
 * Extracts the last segment from a category path.
 * Example: "Muzyka i rozrywka → DJ" returns "DJ"
 */
export function getCategoryLabel(categoryName: string | null | undefined): string {
  if (!categoryName) return 'Brak kategorii'

  const parts = categoryName.split('→')
  return parts[parts.length - 1].trim()
}

export default function OffersCarousel({ offers }: { offers: Offer[] }) {
  return (
    <Carousel
      className="w-5/6 select-none cursor-grab active:cursor-grabbing"
      opts={{
        loop: true,
      }}
      plugins={[
        Autoplay({
          delay: 2000,
        }),
      ]}
    >
      {/* Left fade gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-24 md:w-32 bg-linear-to-r from-background to-transparent z-10 pointer-events-none" />
      {/* Right fade gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-24 md:w-32 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />
      <CarouselContent>
        {offers.map((offer, index) => {
          const mainImage = isExpandedDoc<OfferUpload>(offer.mainImage) ? offer.mainImage : null

          return (
            <CarouselItem
              key={`${offer.id}-${index}`}
              className="basis-2/3 md:basis-1/2 xl:basis-1/3"
            >
              <Card className="bg-transparent rounded-xl h-96 md:h-124 relative overflow-hidden group/featured-offer isolate will-change-transform transform-gpu">
                {/* Image wrapper with its own overflow hidden */}
                <div className="absolute inset-0 -z-10 overflow-hidden rounded-xl">
                  <Image
                    src={mainImage?.url || '/placeholder-image.png'}
                    alt={'Offer Image'}
                    fill
                    className="object-cover transition-all duration-500 ease-out transform-gpu
                          group-hover/featured-offer:scale-110 
                          group-hover/featured-offer:rotate-2 
                          //group-hover/featured-offer:blur-[10px] 
                          group-hover/featured-offer:contrast-110 
                          group-hover/featured-offer:saturate-110"
                  />
                  <div className="bg-linear-to-br from-transparent via-black/25 to-black/75 absolute inset-0 z-0" />
                </div>
                <CardHeader>
                  <Badge variant="default">{getCategoryLabel(offer.categoryName)}</Badge>
                  <p className="font-bebas mix-blend-overlay text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">
                    {offer.title}
                  </p>
                </CardHeader>
                <CardFooter className="absolute bottom-6 left-0">
                  <CMSLink type="custom" url={`/offers/${offer.slug}`} appearance="cta">
                    Poznaj ofertę
                  </CMSLink>
                </CardFooter>
              </Card>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />

      {/* Bottom loading line */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-linear-to-r from-transparent via-stone-400 to-transparent pointer-events-none" />
    </Carousel>
  )
}
