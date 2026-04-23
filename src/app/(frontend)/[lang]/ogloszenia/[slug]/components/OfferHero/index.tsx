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

  // Position only applies when the background is an OfferUpload (i.e. mainImage
  // fallback, or a backgroundImage sourced from offer-uploads). If backgroundImage
  // is a separately-uploaded Media doc without focal data, defaults apply.
  const heroBackgroundImagePosition = isExpandedDoc<OfferUpload>(backgroundImage)
    ? {
        focalX: backgroundImage.focalX ?? undefined,
        focalY: backgroundImage.focalY ?? undefined,
        zoom: backgroundImage.zoom ?? undefined,
      }
    : null

  const title = offer.title.length > 80 ? `${offer.title.slice(0, 80)}…` : offer.title

  return (
    <HighImpactHero
      backgroundImage={heroBackgroundImage as Media}
      backgroundImagePosition={heroBackgroundImagePosition}
      title={title}
    >
      <OfferHeroContent offer={offer} title={title} />
    </HighImpactHero>
  )
}
