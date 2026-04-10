'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { HeartIcon, ExternalLinkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'
import { toggleFavorite } from '@/actions/panel/favorites'
import type { Offer, OfferUpload } from '@/payload-types'

interface FavoritesGridProps {
  offers: Offer[]
  lang: string
}

function formatPrice(offer: Offer): string {
  if (offer.hasPriceRange && offer.priceFrom != null && offer.priceTo != null) {
    return `${offer.priceFrom} – ${offer.priceTo} zł`
  }
  if (offer.price != null) {
    return `${offer.price} zł`
  }
  return 'Cena do ustalenia'
}

function getImageUrl(mainImage: number | OfferUpload): string | null {
  if (typeof mainImage === 'object' && mainImage !== null) {
    return mainImage.url ?? null
  }
  return null
}

function OfferFavoriteCard({
  offer,
  lang,
}: {
  offer: Offer
  lang: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleRemove() {
    startTransition(async () => {
      const result = await toggleFavorite(offer.id)
      if (result.success) {
        toast.success('Usunięto z ulubionych')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Nie udało się usunąć z ulubionych')
      }
    })
  }

  const imageUrl = getImageUrl(offer.mainImage)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="aspect-video overflow-hidden rounded-t-xl relative">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={offer.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-4">
        <p className="font-bebas text-xl tracking-wide leading-tight">{offer.title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {offer.categoryName && (
            <Badge variant="outline">{offer.categoryName}</Badge>
          )}
          <span className="text-sm text-muted-foreground">{formatPrice(offer)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 p-4 pt-0">
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={handleRemove}
          aria-label="Usuń z ulubionych"
        >
          <HeartIcon
            data-icon="inline-start"
            className="fill-current text-destructive"
          />
          Usuń z ulubionych
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${lang}/ogloszenia/${offer.link}`}>
            <ExternalLinkIcon data-icon="inline-start" />
            Zobacz
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export function FavoritesGrid({ offers, lang }: FavoritesGridProps) {
  if (offers.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HeartIcon />
          </EmptyMedia>
          <EmptyTitle>Nie masz jeszcze ulubionych ofert</EmptyTitle>
          <EmptyDescription>
            Przeglądaj oferty i dodawaj je do ulubionych.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href={`/${lang}/ogloszenia`}>Przeglądaj oferty</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer) => (
        <OfferFavoriteCard key={offer.id} offer={offer} lang={lang} />
      ))}
    </div>
  )
}
