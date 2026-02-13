import { Offer } from '@/payload-types'
import { ContactDetails } from './ContactDetails'
import { SocialMedia } from './SocialMedia'
import { TitleH2 } from '@/components/frontend/Content/TitleH2'

interface ContactInfoProps {
  offer: Offer
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ offer }) => {
  const hasSocialMedia =
    offer.socialMedia &&
    (offer.socialMedia.facebook ||
      offer.socialMedia.instagram ||
      offer.socialMedia.tiktok ||
      offer.socialMedia.linkedin)

  const hasContactInfo = offer.phone || offer.email || offer.address

  if (!hasContactInfo && !hasSocialMedia) {
    return null
  }

  return (
    <section className="mx-auto w-full space-y-6 sm:space-y-8">
   {/* Decorative accent divider */}
        <div className="flex items-center justify-center gap-3" aria-hidden="true">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
          <div className="h-1.5 w-3 rounded-full bg-primary/25" />
          <div className="h-1.5 w-8 rounded-full bg-primary/40" />
          <div className="h-1.5 w-3 rounded-full bg-primary/25" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
        </div>

      {/* Section heading with decorative accent */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="shrink-0">
          <TitleH2 title="Kontakt" />
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-6 sm:gap-8 lg:gap-12 w-full min-w-0">
        {hasContactInfo && <ContactDetails offer={offer} />}
        {hasSocialMedia && <SocialMedia offer={offer} />}
      </div>
    </section>
  )
}
