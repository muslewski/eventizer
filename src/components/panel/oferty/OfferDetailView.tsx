import Image from 'next/image'
import Link from 'next/link'
import { PencilIcon, ExternalLinkIcon, PhoneIcon, MailIcon, GlobeIcon } from 'lucide-react'
import { FaFacebook, FaInstagram, FaTiktok, FaLinkedin } from 'react-icons/fa6'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { OfferStatusToggle } from '@/components/panel/oferty/OfferStatusToggle'
import type { Offer } from '@/payload-types'

interface OfferDetailViewProps {
  offer: Offer
  lang: string
}

export function OfferDetailView({ offer, lang }: OfferDetailViewProps) {
  const mainImageUrl =
    typeof offer.mainImage === 'object' && offer.mainImage
      ? offer.mainImage.url
      : null

  const isPublished = offer._status === 'published'

  const priceDisplay = offer.hasPriceRange
    ? offer.priceFrom && offer.priceTo
      ? `od ${offer.priceFrom} do ${offer.priceTo} PLN`
      : null
    : offer.price
      ? `${offer.price} PLN`
      : null

  const gallery = offer.gallery ?? []
  const videoObj =
    typeof offer.video === 'object' && offer.video ? offer.video : null
  const hasMedia = gallery.length > 0 || videoObj !== null

  const { socialMedia } = offer

  return (
    <div className="flex flex-col gap-6">
      {/* Hero section */}
      <div className="relative aspect-[21/9] overflow-hidden rounded-xl">
        {mainImageUrl ? (
          <Image
            src={mainImageUrl}
            alt={offer.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="size-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 flex flex-col gap-2 p-4 sm:p-6">
          <h1 className="font-bebas text-3xl tracking-wide text-white sm:text-4xl">
            {offer.title}
          </h1>
          <Badge
            variant={isPublished ? 'default' : 'secondary'}
            className="w-fit"
          >
            {isPublished ? 'Opublikowana' : 'Robocza'}
          </Badge>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Kategoria */}
        <Card className="bg-background border-border/20">
          <CardHeader>
            <CardDescription>Kategoria</CardDescription>
          </CardHeader>
          <CardContent>
            {offer.categoryName ? (
              <Badge variant="outline">{offer.categoryName}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">Brak kategorii</span>
            )}
          </CardContent>
        </Card>

        {/* Cena */}
        <Card className="bg-background border-border/20">
          <CardHeader>
            <CardDescription>Cena</CardDescription>
          </CardHeader>
          <CardContent>
            {priceDisplay ? (
              <span className="font-medium">{priceDisplay}</span>
            ) : (
              <span className="text-sm text-muted-foreground">Nie podano</span>
            )}
          </CardContent>
        </Card>

        {/* Lokalizacja */}
        <Card className="bg-background border-border/20">
          <CardHeader>
            <CardDescription>Lokalizacja</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {offer.location.address}
              {offer.location.city && offer.location.city !== offer.location.address
                ? `, ${offer.location.city}`
                : ''}
            </p>
          </CardContent>
        </Card>

        {/* Zasięg */}
        <Card className="bg-background border-border/20">
          <CardHeader>
            <CardDescription>Zasięg</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="font-medium">{offer.location.serviceRadius} km</span>
          </CardContent>
        </Card>
      </div>

      {/* Description Card */}
      <Card className="bg-background border-border/20">
        <CardHeader>
          <CardTitle>Opis</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{offer.shortDescription}</p>
          {offer.content && (
            <p className="text-xs text-muted-foreground italic">
              Pełny opis dostępny na stronie oferty.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Media Card */}
      {hasMedia && (
        <Card className="bg-background border-border/20">
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {gallery.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {gallery.map((item) => {
                  const imgObj =
                    typeof item.image === 'object' && item.image
                      ? item.image
                      : null
                  if (!imgObj?.url) return null
                  return (
                    <div
                      key={item.id ?? imgObj.id}
                      className="relative aspect-square overflow-hidden rounded-lg"
                    >
                      <Image
                        src={imgObj.url}
                        alt={item.label ?? offer.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )
                })}
              </div>
            )}
            {videoObj?.url && (
              <div className="overflow-hidden rounded-lg">
                <video
                  src={videoObj.url}
                  controls
                  className="w-full max-w-lg"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contact Card */}
      <Card className="bg-background border-border/20">
        <CardHeader>
          <CardTitle>Kontakt</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {offer.phone && (
            <a
              href={`tel:${offer.phone}`}
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <PhoneIcon className="size-4 shrink-0" />
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
          {!offer.phone &&
            !offer.email &&
            !socialMedia?.website &&
            !socialMedia?.facebook &&
            !socialMedia?.instagram &&
            !socialMedia?.tiktok &&
            !socialMedia?.linkedin && (
              <p className="text-sm text-muted-foreground">
                Brak danych kontaktowych.
              </p>
            )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/${lang}/panel/oferty/${offer.link}/edytuj`}>
            <PencilIcon data-icon="inline-start" />
            Edytuj
          </Link>
        </Button>
        {offer._status === 'published' && (
          <Button variant="outline" asChild>
            <Link
              href={`/${lang}/ogloszenia/${offer.link}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLinkIcon data-icon="inline-start" />
              Podgląd na stronie
            </Link>
          </Button>
        )}
        <OfferStatusToggle
          offerId={offer.id}
          currentStatus={offer._status ?? 'draft'}
        />
      </div>
    </div>
  )
}
