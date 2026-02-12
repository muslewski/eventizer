'use client'

import { useMemo } from 'react'
import { Offer, OfferUpload } from '@/payload-types'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import ImageCarousel, { type CarouselSlide } from '@/components/frontend/Carousel'
import { getCategoryLabel } from '@/blocks/FeaturedOffers/Carousel/OfferCard'

export default function OffersCarousel({ offers }: { offers: Offer[] }) {
  const slides: CarouselSlide[] = useMemo(
    () =>
      offers.map((offer) => {
        const mainImage = isExpandedDoc<OfferUpload>(offer.mainImage) ? offer.mainImage : null
        return {
          id: String(offer.id),
          imageUrl: mainImage?.url || '/placeholder-image.png',
          imageAlt: offer.title || 'Offer Image',
          badge: getCategoryLabel(offer.categoryName),
          label: offer.title,
          link: {
            url: `/ogloszenia/${offer.link}`,
            ctaLabel: 'Poznaj ofertę',
          },
        }
      }),
    [offers],
  )

  return <ImageCarousel slides={slides} ariaLabel="Featured offers carousel" />
}
