import { Phone, MailIcon, GlobeIcon } from 'lucide-react'
import { FaFacebook, FaInstagram, FaTiktok, FaLinkedin } from 'react-icons/fa6'
import type { Offer } from '@/payload-types'
import { InfoCardShell } from './InfoCardShell'

interface ContactCardProps {
  offer: Offer
}

export function ContactCard({ offer }: ContactCardProps) {
  const socialMedia = offer.socialMedia
  const hasAnyContact =
    !!offer.phone ||
    !!offer.email ||
    !!socialMedia?.website ||
    !!socialMedia?.facebook ||
    !!socialMedia?.instagram ||
    !!socialMedia?.tiktok ||
    !!socialMedia?.linkedin

  return (
    <InfoCardShell
      icon={Phone}
      title="Kontakt"
      description="Dane kontaktowe do klientów"
    >
      {hasAnyContact ? (
        <div className="flex flex-col gap-3">
          {offer.phone && (
            <a
              href={`tel:${offer.phone}`}
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <Phone className="size-4 shrink-0" />
              {offer.phone}
            </a>
          )}
          {offer.email && (
            <a
              href={`mailto:${offer.email}`}
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <MailIcon className="size-4 shrink-0" />
              {offer.email}
            </a>
          )}
          {socialMedia?.website && (
            <a
              href={socialMedia.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <GlobeIcon className="size-4 shrink-0" />
              Strona internetowa
            </a>
          )}
          {socialMedia?.facebook && (
            <a
              href={socialMedia.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <FaFacebook className="size-4 shrink-0" />
              Facebook
            </a>
          )}
          {socialMedia?.instagram && (
            <a
              href={socialMedia.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <FaInstagram className="size-4 shrink-0" />
              Instagram
            </a>
          )}
          {socialMedia?.tiktok && (
            <a
              href={socialMedia.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <FaTiktok className="size-4 shrink-0" />
              TikTok
            </a>
          )}
          {socialMedia?.linkedin && (
            <a
              href={socialMedia.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <FaLinkedin className="size-4 shrink-0" />
              LinkedIn
            </a>
          )}
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">Brak danych kontaktowych.</span>
      )}
    </InfoCardShell>
  )
}
