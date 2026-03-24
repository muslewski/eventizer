'use client'

import { useEffect, useMemo, useState } from 'react'
import { Offer, OfferUpload } from '@/payload-types'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import ImageCarousel, { type CarouselSlide } from '@/components/frontend/Carousel'
// import { getCategoryLabel } from '@/blocks/FeaturedOffers/Carousel/OfferCard'

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

const INITIAL_SLIDES = 3

export default function OffersCarousel({ offers }: { offers: Offer[] }) {
  const [allLoaded, setAllLoaded] = useState(false)

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setAllLoaded(true))
      return () => window.cancelIdleCallback(id)
    } else {
      const timer = setTimeout(() => setAllLoaded(true), 100)
      return () => clearTimeout(timer)
    }
  }, [])

  const visibleOffers = allLoaded ? offers : offers.slice(0, INITIAL_SLIDES)

  const slides: CarouselSlide[] = useMemo(
    () =>
      visibleOffers.map((offer) => {
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
    [visibleOffers],
  )

  return <ImageCarousel slides={slides} ariaLabel="Featured offers carousel" />
}
