import { FeaturedOffersClient } from '@/blocks/FeaturedOffers/Component.client'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import { Offer, type FeaturedOffersBlock as FeaturedOffersProps } from '@/payload-types'

export const FeaturedOffersBlock: React.FC<
  FeaturedOffersProps & {
    id?: string | number
    className?: string
  }
> = ({ heading, description, offers, className }) => {
  const offersData = isExpandedDoc<Offer[]>(offers) ? [...offers] : []

  return (
    <FeaturedOffersClient
      heading={heading}
      description={description}
      offers={offersData}
      className={className}
    />
  )
}
