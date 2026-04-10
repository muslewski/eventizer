import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PencilIcon, ExternalLinkIcon } from 'lucide-react'
import type { Offer } from '@/payload-types'

interface OfferCardProps {
  offer: Offer
  lang: string
}

export function OfferCard({ offer, lang }: OfferCardProps) {
  const mainImageUrl =
    typeof offer.mainImage === 'object' && offer.mainImage ? offer.mainImage.url : null

  const isPublished = offer._status === 'published'

  const priceDisplay = offer.hasPriceRange
    ? offer.priceFrom && offer.priceTo
      ? `${offer.priceFrom} – ${offer.priceTo} PLN`
      : null
    : offer.price
      ? `${offer.price} PLN`
      : null

  return (
    <Card>
      <CardHeader className="p-0">
        <div className="relative aspect-video overflow-hidden rounded-t-xl">
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
          <Badge
            variant={isPublished ? 'default' : 'secondary'}
            className="absolute right-2 top-2"
          >
            {isPublished ? 'Opublikowana' : 'Robocza'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 p-4">
        <h3 className="font-bebas text-xl tracking-wide">{offer.title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {offer.categoryName && (
            <Badge variant="outline">{offer.categoryName}</Badge>
          )}
          {priceDisplay && (
            <span className="text-sm text-muted-foreground">{priceDisplay}</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 p-4 pt-0">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${lang}/panel/oferty/${offer.link}`}>
            <PencilIcon data-icon="inline-start" />
            Zarządzaj
          </Link>
        </Button>
        {isPublished && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/ogloszenia/${offer.link}`} target="_blank">
              <ExternalLinkIcon data-icon="inline-start" />
              Podgląd
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
