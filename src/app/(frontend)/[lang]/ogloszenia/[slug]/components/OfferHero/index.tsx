import { Media, Offer, OfferUpload } from '@/payload-types'
import { HighImpactHero } from '@/heros/HighImpact'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import { OfferHeroContent } from './OfferHeroContent'

interface OfferHeroProps {
  offer: Offer
}

export const OfferHero: React.FC<OfferHeroProps> = ({ offer }) => {
  // Use backgroundImage if provided, otherwise fall back to mainImage
  const backgroundImage = offer.backgroundImage || offer.mainImage

  // Convert OfferUpload to Media-like format for HighImpactHero
  const heroBackgroundImage: Partial<Media> | null = isExpandedDoc<OfferUpload>(backgroundImage)
    ? {
        url: backgroundImage.url,
        alt: backgroundImage.title || '',
        width: backgroundImage.width,
        height: backgroundImage.height,
      }
    : null

  return (
    <HighImpactHero backgroundImage={heroBackgroundImage as Media} title={offer.title}>
      <OfferHeroContent offer={offer} />
    </HighImpactHero>
  )
}
