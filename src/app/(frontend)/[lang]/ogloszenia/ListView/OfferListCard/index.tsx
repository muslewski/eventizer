'use client'

import { Card, CardDescription } from '@/components/ui/card'

interface OfferListCardProps {
  title: string
  description: string
  rating: number
  reviewCount: number
  priceMin: number
  priceMax: number
  imageUrl?: string
}

export const OfferListCard = ({
  title,
  description,
  rating,
  reviewCount,
  priceMin,
  priceMax,
  imageUrl,
}: OfferListCardProps) => {
  const renderStars = (rating: number) => {
    return '⭐'.repeat(Math.round(rating))
  }

  const formatPrice = (min: number, max: number) => {
    if (min === max) {
      return `$${min.toFixed(2)}`
    }
    return `$${min.toFixed(2)} - $${max.toFixed(2)}`
  }

  return (
    <Card className="w-full max-w-5xl 2xl:min-w-5xl flex xl:flex-row flex-col py-0 sm:py-0 h-120 xl:h-48 overflow-hidden items-center bg-transparent bg-linear-to-r from-stone-900/60 to-background/35 rounded-2xl">
      <div className="w-full max-w-2xl min-w-3xs h-full rounded-2xl bg-white/10">
        {/* {imageUrl && <Image src={imageUrl} alt={title} fill className="object-cover" />} */}
      </div>

      <div className="xl:pb-6 xl:pt-6 sm:pb-6 sm:pt-0 pb-6 pt-6 flex flex-row gap-8 justify-between w-full px-6 xl:px-0 xl:pr-6">
        <div className="w-full xl:max-w-md flex flex-col gap-2">
          <h3 className="xl:text-5xl w-full md:text-4xl sm:text-3xl text-2xl font-bebas max-w-7xl text-foreground leading-[0.9] truncate">
            {title}
          </h3>
          <p className="line-clamp-3">{description}</p>
        </div>
        <CardDescription className="flex flex-col justify-between w-60">
          {/* opinion and enter button */}
          <div>
            <div>
              {renderStars(rating)} ({reviewCount} opinii)
            </div>
          </div>

          {/* Price */}
          <div className="p-4 bg-linear-to-r from-stone-950/60 to-background/35 rounded-2xl border border-foreground/10">
            <p className="xl:text-2xl w-full md:text-xl sm:text-md text-sm font-montserrat font-medium max-w-6xl text-foreground leading-[0.9] truncate whitespace-nowrap">
              {formatPrice(priceMin, priceMax)}
            </p>
          </div>
        </CardDescription>
      </div>
    </Card>
  )
}
