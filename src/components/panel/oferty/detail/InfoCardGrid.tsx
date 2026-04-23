import type { Offer } from '@/payload-types'
import { AnimatedCardGrid, AnimatedCard } from '@/components/panel/AnimatedCards'
import { CategoryCard } from './CategoryCard'
import { PriceCard } from './PriceCard'
import { LocationCard } from './LocationCard'
import { RadiusCard } from './RadiusCard'
import { DescriptionCard } from './DescriptionCard'
import { ContactCard } from './ContactCard'

interface InfoCardGridProps {
  offer: Offer
}

export function InfoCardGrid({ offer }: InfoCardGridProps) {
  const { location } = offer

  return (
    <AnimatedCardGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AnimatedCard delay={0}>
        <CategoryCard categoryName={offer.categoryName} />
      </AnimatedCard>
      <AnimatedCard delay={0.05}>
        <PriceCard
          hasPriceRange={offer.hasPriceRange}
          price={offer.price}
          priceFrom={offer.priceFrom}
          priceTo={offer.priceTo}
        />
      </AnimatedCard>
      <AnimatedCard delay={0.1}>
        <LocationCard
          address={location.address}
          city={location.city ?? null}
          lat={location.lat ?? null}
          lng={location.lng ?? null}
        />
      </AnimatedCard>
      <AnimatedCard delay={0.15}>
        <RadiusCard radiusKm={location.serviceRadius} />
      </AnimatedCard>
      <AnimatedCard delay={0.2} className="lg:col-span-2">
        <DescriptionCard shortDescription={offer.shortDescription} />
      </AnimatedCard>
      <AnimatedCard delay={0.25} className="lg:col-span-2">
        <ContactCard offer={offer} />
      </AnimatedCard>
    </AnimatedCardGrid>
  )
}
