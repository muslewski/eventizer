import { PaginationInfo } from '@/app/(frontend)/[lang]/ogloszenia/ListView/index.client'
import { OfferListCard } from '@/app/(frontend)/[lang]/ogloszenia/ListView/OffersView/OfferListCard'
import PaginationControls from '@/app/(frontend)/[lang]/ogloszenia/ListView/PaginationControls'
import { ScrollArea } from '@/components/ui/scroll-area'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import type { Offer, OfferUpload } from '@/payload-types'

export default function OffersView({
  offers,
  pagination,
  pathname,
}: {
  offers: Offer[] | null
  pagination: PaginationInfo
  pathname: string
}) {
  return (
    <ScrollArea className="w-full h-[calc(100%-25px)] overflow-hidden" type="always">
      <div className="flex flex-col gap-6 items-center w-full pr-6">
        {/* Map offers */}
        {offers && offers.length > 0 ? (
          offers.map((offer) => (
            <OfferListCard
              imageUrl={
                isExpandedDoc<OfferUpload>(offer.mainImage)
                  ? (offer.mainImage?.url ?? undefined)
                  : undefined
              }
              key={offer.id}
              title={offer.title}
              description={offer.shortDescription}
              rating={4.5}
              reviewCount={27}
              priceMin={offer.priceFrom || 0}
              priceMax={offer.priceTo || 0}
            />
          ))
        ) : (
          <p>{'Brak dostępnych ofert.'}</p>
        )}

        {/* Pagination controls */}
        <PaginationControls pagination={pagination} pathname={pathname} />
      </div>
    </ScrollArea>
  )
}
