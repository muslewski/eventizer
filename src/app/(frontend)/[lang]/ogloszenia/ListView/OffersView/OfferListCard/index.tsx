'use client'

import { Button } from '@/components/ui/button'
import { Card, CardDescription } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'

interface OfferListCardProps {
  title: string
  description: string
  categoryName?: string
  serviceArea?: string[]
  priceMin: number
  priceMax: number
  price?: number
  hasPriceRange?: boolean
  imageUrl?: string
  slug: string
}

export const OfferListCard = ({
  title,
  description,
  categoryName,
  serviceArea,
  priceMin,
  priceMax,
  price,
  hasPriceRange,
  imageUrl,
  slug,
}: OfferListCardProps) => {
  const formatPrice = () => {
    // Single price offer
    if (!hasPriceRange) {
      return `${(price ?? 0).toFixed(2)} zł`
    }

    // Price range offer
    if (priceMin === priceMax) {
      return `${priceMin.toFixed(2)} zł`
    }
    return `${priceMin.toFixed(2)} zł - ${priceMax.toFixed(2)} zł`
  }

  return (
    <Card className="w-full flex xl:flex-row flex-col py-0 sm:py-0 h-120 sm:h-130 xl:h-48  items-center bg-transparent bg-linear-to-r from-stone-200 dark:from-stone-900/60 to-background/35 rounded-2xl overflow-hidden">
      <Link
        href={`/ogloszenia/${slug}`}
        className="w-full xl:max-w-3xs h-full bottom-0 top-0 rounded-2xl bg-white/10 relative overflow-hidden dark:shadow-[6px_0px_32px_2px_rgba(24,10,10,1)]"
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300 ease-in-out"
          />
        )}
      </Link>

      {/* Content */}
      <div className="xl:pb-6 xl:pt-6 sm:pb-6 sm:pt-0 pb-6 pt-6 flex flex-col lg:flex-row gap-8 justify-between  w-full min-w-0 px-6 xl:px-0 xl:pr-6">
        <div className="w-full flex flex-col gap-2">
          <Link
            href={`/ogloszenia/${slug}`}
            className="min-w-0 font-bebas text-3xl sm:text-4xl leading-[0.95] text-foreground truncate hover:text-muted-foreground transition-colors"
          >
            {title}
          </Link>

          <p className="line-clamp-3 w-full">{description}</p>

          {(categoryName || (serviceArea && serviceArea.length > 0)) && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {categoryName ? (
                <span className="inline-flex items-center rounded-md border px-2 py-1 bg-background">
                  {categoryName.includes('→')
                    ? categoryName.split('→').pop()?.trim()
                    : categoryName}
                </span>
              ) : null}

              {serviceArea && serviceArea.length > 0 ? (
                <span className="inline-flex items-center rounded-md border px-2 py-1 bg-background">
                  {serviceArea.slice(0, 2).join(', ')}
                  {serviceArea.length > 2 ? ` +${serviceArea.length - 2}` : ''}
                </span>
              ) : null}
            </div>
          )}
        </div>
        <CardDescription className="flex flex-row gap-4 flex-wrap lg:flex-col items-start lg:items-end justify-between w-full lg:w-fit">
          <div className="min-w-0 text-start lg:text-end">
            <div className="text-xs text-muted-foreground">Cena</div>
            <div className="font-montserrat font-semibold text-foreground whitespace-nowrap ">
              {formatPrice()}
            </div>
          </div>

          {/* View button */}
          <Button asChild variant="secondary">
            <Link href={`/ogloszenia/${slug}`}>Sprawdź</Link>
          </Button>

          {/* Price */}
          {/* <div className="lg:w-42 max-w-xs p-4 bg-linear-to-r dark:from-stone-950/60 from-stone-200 dark:to-background/35 rounded-2xl border border-foreground/10">
            <p className="md:text-xl sm:text-md text-sm font-montserrat font-medium w-full text-foreground leading-[0.9] truncate whitespace-nowrap ">
              {formatPrice()}
            </p>
          </div> */}
        </CardDescription>
      </div>
    </Card>
  )
}
