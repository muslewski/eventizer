'use client'

import type { Offer } from '@/payload-types'
import { BlockHeader } from '@/components/frontend/Content/BlockHeader'
import OffersCarousel from '@/blocks/FeaturedOffers/Carousel'

/**
 * "Other offers by this provider" — surfaces below the offer's contact form
 * when the service provider owns more than one published offer.
 *
 * Reuses the same `OffersCarousel` the FeaturedOffers Payload block renders,
 * so the visual language is identical to the homepage carousel. The block
 * header here uses a different badge label/copy so it reads as the offer
 * page's "other from this seller" section rather than a curated highlight.
 *
 * Data is fetched server-side in page.tsx and passed in via props — keeps
 * this a thin presentational client component compatible with the
 * surrounding LivePreviewOffer client tree.
 */
export function OtherOffersByProvider({ offers }: { offers: Offer[] }) {
  if (!offers || offers.length === 0) return null

  return (
    <section className="flex flex-col gap-16 -px-4 sm:px-8 -ml-4 sm:-ml-8 w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] bg-linear-to-b from-background dark:via-black/25 to-background">
      <BlockHeader
        heading="Inne oferty tego usługodawcy"
        description="Zobacz, co jeszcze przygotował ten usługodawca — może pasować do Twojego wydarzenia."
        badge={{ label: 'Więcej od usługodawcy', variant: 'golden' }}
        lines
      />
      <div className="w-full flex items-center justify-center relative">
        <OffersCarousel offers={offers} />
      </div>
    </section>
  )
}
