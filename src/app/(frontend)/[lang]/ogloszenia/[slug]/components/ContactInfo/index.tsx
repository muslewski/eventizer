import { Offer } from '@/payload-types'
import { ContactDetails } from './ContactDetails'
import { SocialMedia } from './SocialMedia'

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
    <section className="mx-auto w-full">
      <div className="flex flex-col lg:flex-row lg:items-start gap-6 sm:gap-8 lg:gap-12 w-full min-w-0">
        {hasContactInfo && <ContactDetails offer={offer} />}
        {hasSocialMedia && <SocialMedia offer={offer} />}
      </div>
    </section>
  )
}
