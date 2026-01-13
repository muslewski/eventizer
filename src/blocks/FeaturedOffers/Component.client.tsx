import { Offer, OfferUpload } from '@/payload-types'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { TitleH2 } from '@/components/frontend/Content/TitleH2'
import { Badge } from '@/components/ui/badge'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import Image from 'next/image'
import { CMSLink } from '@/components/payload/Link'

interface FeaturedOffersClientProps {
  heading: string
  description: string
  offers: Offer[]
  className?: string
}

/**
 * Extracts the last segment from a category path.
 * Example: "Muzyka i rozrywka → DJ" returns "DJ"
 */
export function getCategoryLabel(categoryName: string | null | undefined): string {
  if (!categoryName) return 'Brak kategorii'

  const parts = categoryName.split('→')
  return parts[parts.length - 1].trim()
}

export const FeaturedOffersClient: React.FC<FeaturedOffersClientProps> = ({
  heading,
  description,
  offers,
  className,
}) => {
  return (
    <div className="flex flex-col gap-16">
      {/* Top of Featured Offers */}
      <div className="flex flex-col gap-16 relative">
        {/* Decorative accent bottom center */}
        {/* <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-linear-to-r from-transparent via-yellow-400 blur-md to-transparent rounded-full" /> */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-1 bg-linear-to-r from-transparent via-stone-400 blur-md to-transparent rounded-full" />

        {/* Decorative scroll indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          <div className="w-3 h-3 border-b-2 border-r-2 border-yellow-400/60 rotate-45" />
          <div className="w-2 h-2 border-b-2 border-r-2 border-yellow-400/40 rotate-45" />
        </div>

        {/* Decorative scroll indicator */}
        {/* <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-px h-4 bg-linear-to-b from-yellow-400/60 to-transparent" />
          <div className="w-2 h-2 rotate-45 border border-yellow-400/60 mt-1" />
        </div> */}

        {/* Line */}
        <div className="bg-linear-to-r from-yellow-400/50 via-transparent to-transparent h-px w-[calc(100%+4rem)] -ml-8" />

        {/* Header of Featured Offers */}
        <div className="text-center flex flex-col items-center gap-6">
          <Badge variant="golden">Wyróżnione Oferty</Badge>
          <div className="flex flex-col items-center">
            <TitleH2 title={heading} />
            <p>{description}</p>
          </div>
        </div>

        {/* Line */}
        <div className="bg-linear-to-l from-yellow-400/40 via-transparent to-transparent h-px w-[calc(100%+4rem)] -ml-8" />

        {/* Corner accents */}
        <div className="absolute top-0 right-0 w-8 h-8 border-r border-t border-yellow-400/20" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-l border-b border-yellow-400/20" />
      </div>

      {/* Carousel of Featured Offers */}
      <div className="w-full flex items-center justify-center relative">
        <Carousel className="w-5/6">
          <CarouselContent>
            {offers.map((offer, index) => {
              const mainImage = isExpandedDoc<OfferUpload>(offer.mainImage) ? offer.mainImage : null

              return (
                <CarouselItem key={`${offer.id}-${index}`} className="basis-1/2 lg:basis-1/3">
                  <Card className="bg-transparent rounded-xl h-124 relative overflow-hidden group/featured-offer isolate will-change-transform transform-gpu">
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
                      <p className="font-bebas mix-blend-overlay transition-all group-hover/featured-offer:mix-blend-lighten text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">
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
        </Carousel>
      </div>
    </div>
  )
}
