import { Offer } from '@/payload-types'
import { Badge } from '@/components/ui/badge'
import { MapPin, Tag } from 'lucide-react'
import BlurText from '@/components/react-bits/BlurText'

interface OfferHeroContentProps {
  offer: Offer
}

const formatPrice = (offer: Offer) => {
  if (!offer.hasPriceRange) {
    return `${(offer.price ?? 0).toLocaleString('pl-PL')} zł`
  }

  const priceFrom = offer.priceFrom ?? 0
  const priceTo = offer.priceTo ?? 0

  if (priceFrom === priceTo) {
    return `${priceFrom.toLocaleString('pl-PL')} zł`
  }

  return `${priceFrom.toLocaleString('pl-PL')} - ${priceTo.toLocaleString('pl-PL')} zł`
}

export const OfferHeroContent: React.FC<OfferHeroContentProps> = ({ offer }) => {
  return (
    <div className="h-full relative flex flex-col justify-end gap-6 sm:gap-10">
      {/* Top section with category badges */}
      <div className="flex flex-col gap-4 mt-auto">
        {/* Category badge */}
        {offer.categoryName && (
          <Badge variant="blend" className="gap-2">
            <Tag className="size-3" />
            {offer.categoryName}
          </Badge>
        )}

        {/* Location badge */}
        {offer.location?.city && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="blend" className="gap-1.5 opacity-75">
              <MapPin className="size-3" />
              {offer.location.city}
              {offer.location.serviceRadius && ` • ${offer.location.serviceRadius} km`}
            </Badge>
          </div>
        )}
      </div>

      {/* Title */}
      <h1 className="xl:text-8xl md:text-6xl text-4xl sm:text-5xl font-bebas max-w-7xl text-white mix-blend-difference transform-gpu leading-[0.9]">
        <BlurText text={offer.title} animateBy="letters" direction="bottom" delay={50} />
      </h1>

      {/* Bottom section */}
      <div className="w-full justify-between gap-6 flex flex-col sm:flex-row items-start sm:items-center border-white/10 border-t pt-6 sm:pt-8">
        {/* Price display */}
        <div className="flex items-center gap-4">
          <div className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
            <p className="text-xl sm:text-2xl md:text-3xl font-montserrat font-semibold text-white">
              {formatPrice(offer)}
            </p>
            <p className="text-xs text-white/60 mt-1">
              {offer.hasPriceRange ? 'cena zależna od zakresu usługi' : 'cena z góry ustalona'}
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="hidden sm:flex gap-4">
          <div className="h-4 w-8 bg-white/15 mix-blend-difference rounded-full" />
          <div className="h-4 w-16 bg-white/75 mix-blend-difference rounded-full" />
          <div className="h-4 w-8 bg-white/15 mix-blend-difference rounded-full" />
        </div>
      </div>
    </div>
  )
}
