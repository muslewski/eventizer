'use client'

import Link from 'next/link'
import { Pencil, MapPin, Tag, ExternalLink } from 'lucide-react'
import type { Offer, OfferUpload } from '@/payload-types'

interface UserOfferCardProps {
  offer: Offer
  categoryIconUrl?: string | null
  adminRoute: string
}

export function UserOfferCard({ offer, categoryIconUrl, adminRoute }: UserOfferCardProps) {
  const mainImage =
    typeof offer.mainImage === 'object' ? (offer.mainImage as OfferUpload) : null
  const imageUrl = mainImage?.url ?? null

  // Price display
  const priceLabel = offer.hasPriceRange
    ? `${(offer.priceFrom ?? 0).toFixed(2)} – ${(offer.priceTo ?? 0).toFixed(2)} zł`
    : offer.price != null
      ? `${offer.price.toFixed(2)} zł`
      : null

  const statusLabel = offer._status === 'published' ? 'Opublikowana' : 'Szkic'
  const isPublished = offer._status === 'published'

  // Extract last part of category name for cleaner display
  const categoryShort = offer.categoryName?.includes('→')
    ? offer.categoryName.split('→').pop()?.trim()
    : offer.categoryName

  return (
    <div className="group relative flex flex-col sm:flex-row max-w-3xl overflow-hidden rounded-2xl border border-(--theme-border-color) bg-(--theme-elevation-50) transition-all duration-300 hover:shadow-xl hover:border-(--theme-elevation-400) sm:h-52">
      {/* Image section */}
      <Link
        href={`${adminRoute}/collections/offers/${offer.id}`}
        className="relative w-full sm:w-56 md:w-64 shrink-0 h-48 sm:h-full overflow-hidden bg-(--theme-elevation-100) no-underline"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={offer.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Tag className="h-12 w-12 text-(--theme-elevation-300)" />
          </div>
        )}
        {/* Elegant overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/30 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-black/20" />

        {/* Status badge */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm ${
              isPublished
                ? 'bg-green-500/80 text-white'
                : 'bg-amber-500/80 text-white'
            }`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${isPublished ? 'bg-green-200' : 'bg-amber-200'}`}
            />
            {statusLabel}
          </span>
        </div>
      </Link>

      {/* Content section */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-5 min-w-0">
        {/* Top: title + description */}
        <div className="flex flex-col gap-2 min-w-0">
          <Link
            href={`${adminRoute}/collections/offers/${offer.id}`}
            className="no-underline min-w-0"
          >
            <h3 className="font-bebas text-3xl md:text-4xl leading-[0.95] m-0 text-(--theme-elevation-800) group-hover:text-accent-foreground dark:group-hover:text-accent transition-colors line-clamp-2 sm:line-clamp-1">
              {offer.title}
            </h3>
          </Link>

          {offer.shortDescription && (
            <p className="text-sm text-(--theme-elevation-500) line-clamp-2 m-0 leading-relaxed">
              {offer.shortDescription}
            </p>
          )}
        </div>

        {/* Middle: tags row */}
        <div className="flex flex-wrap items-center gap-2">
          {categoryShort && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-(--theme-border-color) px-2 py-1 text-xs text-(--theme-elevation-600) bg-(--theme-elevation-50)">
              {categoryIconUrl ? (
                <img src={categoryIconUrl} alt="" className="h-3.5 w-3.5 shrink-0 object-contain dark:invert" />
              ) : (
                <Tag className="h-3 w-3 shrink-0" />
              )}
              {categoryShort}
            </span>
          )}

          {offer.location?.city && (
            <span className="inline-flex items-center gap-1 rounded-md border border-(--theme-border-color) px-2 py-1 text-xs text-(--theme-elevation-600) bg-(--theme-elevation-50)">
              <MapPin className="h-3 w-3 shrink-0" />
              {offer.location.city}
            </span>
          )}
        </div>

        {/* Bottom: price + actions */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Price */}
          {priceLabel && (
            <div className="px-3 py-1.5 rounded-lg bg-(--theme-elevation-100) border border-(--theme-border-color)">
              <span className="font-bebas text-xl tracking-wide text-(--theme-elevation-700)">
                {priceLabel}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isPublished && offer.link && (
              <a
                href={`/ogloszenia/${offer.link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-(--theme-elevation-500) hover:text-(--theme-elevation-700) hover:bg-(--theme-elevation-100) transition-colors no-underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Podgląd
              </a>
            )}
            <Link
              href={`${adminRoute}/collections/offers/${offer.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-3.5 py-1.5 text-xs font-semibold text-accent-foreground dark:text-accent transition-colors hover:bg-accent/15 hover:border-accent/50 no-underline"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edytuj ofertę
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
