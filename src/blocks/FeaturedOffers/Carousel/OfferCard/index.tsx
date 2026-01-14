import { isExpandedDoc } from '@/lib/isExpandedDoc'
import { Offer, OfferUpload } from '@/payload-types'

import { Card, CardFooter, CardHeader } from '@/components/ui/card'

import Image from 'next/image'
import { CMSLink } from '@/components/payload/Link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'

/**
 * Extracts the last segment from a category path.
 * Example: "Muzyka i rozrywka → DJ" returns "DJ"
 */
export function getCategoryLabel(categoryName: string | null | undefined): string {
  if (!categoryName) return 'Brak kategorii'

  const parts = categoryName.split('→')
  return parts[parts.length - 1].trim()
}

interface OfferCardProps {
  offer: Offer
  isActive: boolean
}

export default function OfferCarouselCard({ offer, isActive }: OfferCardProps) {
  const mainImage = isExpandedDoc<OfferUpload>(offer.mainImage) ? offer.mainImage : null
  return (
    <Card
      className={cn(
        'bg-transparent rounded-xl h-80 sm:h-96 md:h-124 relative overflow-hidden group/featured-offer isolate will-change-transform transform-gpu duration-500 transition-all',
        isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-70',
      )}
    >
      {/* Image wrapper with its own overflow hidden */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-xl">
        <Image
          src={mainImage?.url || '/placeholder-image.png'}
          alt={offer.title || 'Offer Image'}
          fill
          priority={isActive}
          sizes="(max-width: 768px) 66vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition-all duration-500 ease-out transform-gpu
                          group-hover/featured-offer:scale-110 
                          group-hover/featured-offer:rotate-2 
                          group-hover/featured-offer:contrast-110
                          group-hover/featured-offer:hue-rotate-[-12deg]"
        />

        {/* Gradient overlay with smoother blend */}
        <div className="absolute inset-0 z-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 z-0 bg-linear-to-br from-transparent via-transparent to-black/40" />
      </div>
      <CardHeader>
        <Badge variant="default">{getCategoryLabel(offer.categoryName)}</Badge>
        <Link
          href={`/offers/${offer.slug}`}
          className="font-bebas mix-blend-overlay text-2xl sm:text-3xl lg:text-4xl xl:text-5xl hover:scale-105 transition-transform duration-300"
        >
          {offer.title}
        </Link>
      </CardHeader>
      <CardFooter className="absolute bottom-6 left-0">
        <CMSLink type="custom" url={`/offers/${offer.slug}`} appearance="cta" size="sm">
          Poznaj ofertę
        </CMSLink>
      </CardFooter>
    </Card>
  )
}
