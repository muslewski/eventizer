'use client'

import { useMemo } from 'react'
import { Offer, OfferUpload } from '@/payload-types'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import ImageCarousel, { type CarouselSlide } from '@/components/frontend/Carousel'

interface OfferGalleryProps {
  offer: Offer
}

export const OfferGallery: React.FC<OfferGalleryProps> = ({ offer }) => {
  const slides: CarouselSlide[] = useMemo(() => {
    if (!offer.gallery || offer.gallery.length === 0) return []

    return offer.gallery
      .map((item) => {
        const image = isExpandedDoc<OfferUpload>(item.image) ? item.image : null
        if (!image?.url) return null

        return {
          id: item.id ?? image.id?.toString() ?? Math.random().toString(),
          imageUrl: image.url,
          imageAlt: image.title || item.label || offer.title,
          label: item.label ?? null,
        }
      })
      .filter(Boolean) as CarouselSlide[]
  }, [offer.gallery, offer.title])

  if (slides.length === 0) return null

  return (
    <section className="w-full flex items-center justify-center">
      <ImageCarousel slides={slides} autoplayDelay={4500} ariaLabel="Galeria oferty" lightbox />
    </section>
  )
}
