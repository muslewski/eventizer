import { Offer, OfferUpload } from '@/payload-types'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import Image from 'next/image'
import { Quote } from 'lucide-react'
import { TitleH3 } from '@/components/frontend/Content/TitleH3'

interface OfferShortInfoProps {
  offer: Offer
}

export const OfferShortInfo: React.FC<OfferShortInfoProps> = ({ offer }) => {
  const mainImage = isExpandedDoc<OfferUpload>(offer.mainImage) ? offer.mainImage : null

  // Don't render if there's no image and no short description
  if ((!mainImage || !mainImage.url) && !offer.shortDescription) return null

  return (
    <section className="py-16 flex flex-col justify-center sm:flex-row items-center gap-6 sm:gap-8 md:gap-12 mx-auto max-w-4xl">
      {/* Circle main image */}
      {mainImage && mainImage.url && (
        <div className="relative shrink-0">
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-primary/20 shadow-2xl shadow-primary/10">
            <Image
              src={mainImage.url}
              alt={mainImage.title || offer.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 192px"
            />
          </div>
          {/* Decorative ring */}
          <div
            className="absolute -inset-2 rounded-full border-2 border-dashed border-primary/30 animate-spin-slow"
            style={{ animationDuration: '20s' }}
          />
        </div>
      )}

      {/* Short description */}
      {offer.shortDescription && (
        <div className="flex-1 min-w-0 text-center sm:text-left flex flex-col items-center sm:items-start mt-2 gap-4 relative">
          <div className="w-fit">
            <TitleH3 title="W skrócie" />
          </div>
          <div className="relative pl-4 sm:pl-5 border-l-2 border-primary/40">
            <Quote className="absolute -left-3 -top-1 size-5 sm:size-6 text-primary/30 fill-primary/10" />
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl break-words italic">
              {offer.shortDescription}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
