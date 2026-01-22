'use client'

import { Card, CardDescription } from '@/components/ui/card'
import Image from 'next/image'

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
      return `${min.toFixed(2)} zł`
    }
    return `${min.toFixed(2)} zł - ${max.toFixed(2)} zł`
  }

  return (
    <Card className="w-full flex xl:flex-row flex-col py-0 sm:py-0 h-120 sm:h-130 xl:h-48  items-center bg-transparent bg-linear-to-r from-stone-900/60 to-background/35 rounded-2xl overflow-hidden">
      <div className="w-full xl:max-w-3xs h-full bottom-0 top-0 rounded-2xl bg-white/10 relative overflow-hidden shadow-[6px_0px_32px_2px_rgba(10,10,10,1)]">
        {imageUrl && <Image src={imageUrl} alt={title} fill className="object-cover" />}
      </div>

      {/* Content */}
      <div className="xl:pb-6 xl:pt-6 sm:pb-6 sm:pt-0 pb-6 pt-6 flex flex-col lg:flex-row gap-8 justify-between  w-full min-w-0 px-6 xl:px-0 xl:pr-6">
        <div className="w-full flex flex-col gap-2">
          <h3 className="xl:text-5xl w-full md:text-4xl sm:text-3xl text-2xl font-bebas text-foreground leading-[0.9] truncate">
            {title}
          </h3>
          <p className="line-clamp-3 w-full">{description}</p>
        </div>
        <CardDescription className="flex flex-row gap-4 flex-wrap lg:flex-col items-start lg:items-end justify-between w-full lg:w-fit">
          {/* opinion and enter button */}
          <div>
            <div>
              {renderStars(rating)} ({reviewCount} opinii)
            </div>
          </div>

          {/* Price */}
          <div className="lg:w-42 max-w-xs p-4 bg-linear-to-r from-stone-950/60 to-background/35 rounded-2xl border border-foreground/10">
            <p className="xl:text-2xl md:text-xl sm:text-md text-sm font-montserrat font-medium w-full text-foreground leading-[0.9] truncate whitespace-nowrap ">
              {formatPrice(priceMin, priceMax)}
            </p>
          </div>
        </CardDescription>
      </div>
    </Card>
  )
}
