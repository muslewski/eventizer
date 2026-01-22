import { OfferListCard } from '@/app/(frontend)/[lang]/ogloszenia/ListView/OfferListCard'
import { TitleH3 } from '@/components/frontend/Content/TitleH3'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import { Offer, OfferUpload } from '@/payload-types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Scroll, Search, Settings2Icon } from 'lucide-react'

interface ClientListViewProps {
  offers: Offer[] | null
}

export default function ClientListView({ offers }: ClientListViewProps) {
  return (
    <div className="flex w-full gap-8 h-screen max-h-screen">
      {/* Category Selection */}
      <div className="max-w-64 w-1/4 h-full border-r rounded-r-2xl p-8">
        <TitleH3 title={'Kategorie'} />
      </div>

      {/* Main Search bar and offers */}
      <div className="w-full max-w-6xl h-full min-w-0 py-0 flex flex-col gap-8 ">
        {/* Search Bar */}
        <div className="flex gap-6 h-16 min-h-16">
          {/* Search */}
          <div className="flex items-center gap-6 h-full bg-linear-to-r bg-black/60 border px-6 py-4 rounded-2xl w-full">
            <Search size={38} />
            <p>{'Szukaj wykonawców i atrakcji'}</p>
          </div>

          {/* Settings */}
          <div className="flex h-full px-6 py-4 items-center bg-black/60 border rounded-2xl">
            <Settings2Icon size={38} />
          </div>
        </div>

        {/* Display offers */}
        <ScrollArea className="w-full h-[calc(100%-25px)] overflow-hidden" type="always">
          <div className="flex flex-col gap-6 items-center w-full px-6">
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
          </div>
        </ScrollArea>
      </div>

      {/* right side with selected offers */}
      {/* <div className="max-w-md hidden 2xl:flex w-full h-full border-l rounded-l-2xl p-8 flex-col gap-12">
        <div>
          <TitleH3 title={'Ogłoszenie'} />
        </div>

        //Special offer
        <div className="mt-auto">
          <TitleH3 title={'Oferta specjalna'} />
        </div>
      </div> */}
    </div>
  )
}
