import { OfferListCard } from '@/app/(frontend)/[lang]/ogloszenia/ListView/OfferListCard'
import { TitleH3 } from '@/components/frontend/Content/TitleH3'
import { Offer } from '@/payload-types'

interface ClientListViewProps {
  offers: Offer[] | null
}

export default function ClientListView({ offers }: ClientListViewProps) {
  return (
    <div className="flex w-full gap-8 h-screen max-h-screen">
      {/* Category Selection */}
      <div className="w-96 h-full border-r rounded-r-2xl p-8">
        <TitleH3 title={'Kategorie'} />
      </div>

      {/* Main Search bar and offers */}
      <div className="w-full h-full py-8 flex flex-col gap-8">
        <div className="flex">
          {/* Search Bar */}
          <p>{'Szukaj wykonawców i atrakcji'}</p>

          {/* Settings */}
          <div>set</div>
        </div>

        {/* Display offers */}
        <div className="flex flex-col gap-8 items-center w-full">
          {/* Example offer */}
          <OfferListCard
            title="Example Offer Title aasdafss"
            description="Profesjonalny DJ z pasją do muzyki, specjalizujący się w oprawie weselnej. Tworzę dynamiczne sety z hitami z różnych epok zapewniając niezapomnianą zabawę i pełne parkietu przez całą noc."
            rating={5}
            reviewCount={120}
            priceMin={99.99}
            priceMax={100.0}
          />
        </div>
      </div>

      {/* right side with selected offers */}
      <div className="max-w-2xl hidden 2xl:flex w-full h-full border-l rounded-l-2xl p-8 flex-col gap-12">
        <div>
          <TitleH3 title={'Ogłoszenie'} />
        </div>

        {/* Special offer */}
        <div className="mt-auto">
          <TitleH3 title={'Oferta specjalna'} />
        </div>
      </div>
    </div>
  )
}
