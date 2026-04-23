import Image from 'next/image'
import Link from 'next/link'
import { PositionedImage } from '@/components/image-position/PositionedImage'
import type { ImagePosition } from '@/components/image-position/types'
import { PencilIcon, ExternalLinkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { OfferStatusToggle } from '@/components/panel/oferty/OfferStatusToggle'
import { DeleteOfferButton } from '@/components/panel/oferty/DeleteOfferButton'
import { InfoCardGrid } from '@/components/panel/oferty/detail/InfoCardGrid'
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

  const gallery = offer.gallery ?? []
  const videoObj =
    typeof offer.video === 'object' && offer.video ? offer.video : null
  const hasMedia = gallery.length > 0 || videoObj !== null

  return (
    <div className="flex flex-col gap-6">
      {/* Hero section */}
      <div className="relative aspect-[21/9] overflow-hidden rounded-xl">
        {mainImageUrl ? (
          <PositionedImage
            src={mainImageUrl}
            alt={offer.title}
            position={typeof offer.mainImage === 'object' ? (offer.mainImage as Partial<ImagePosition>) : null}
            className="absolute inset-0"
            sizes="100vw"
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
      <InfoCardGrid offer={offer} />

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
        <DeleteOfferButton
          offerId={offer.id}
          offerTitle={offer.title ?? 'oferta'}
          lang={lang}
        />
      </div>
    </div>
  )
}
