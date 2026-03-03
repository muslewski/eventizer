import Link from 'next/link'
import { ArrowRight, LayoutList } from 'lucide-react'
import type { Offer } from '@/payload-types'
import { UserOfferCard } from '../UserOfferCard'

interface OfferWithIcon {
  offer: Offer
  categoryIconUrl?: string | null
}

interface UserOffersSectionProps {
  offers: OfferWithIcon[]
  adminRoute: string
  totalDocs: number
}

/**
 * Shown on the dashboard when a service-provider has a maxOffers limit greater
 * than 1 (enterprise / special accounts).
 *
 * Displays up to 3 most recent offers and a "Zobacz wszystkie" button that
 * navigates to the full offers collection.
 */
export function UserOffersSection({ offers, adminRoute, totalDocs }: UserOffersSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LayoutList className="size-5 text-(--theme-elevation-500)" />
          <h2 className="font-bebas text-2xl md:text-3xl tracking-wide text-(--theme-elevation-800) m-0 leading-none">
            Ostatnio dodane oferty
          </h2>
          {totalDocs > 0 && (
            <span className="inline-flex items-center rounded-full bg-(--theme-elevation-100) border border-(--theme-border-color) px-2 py-0.5 text-xs font-medium text-(--theme-elevation-500)">
              {totalDocs}
            </span>
          )}
        </div>

        <Link
          href={`${adminRoute}/collections/offers`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-3.5 py-1.5 text-xs font-semibold text-accent-foreground dark:text-accent transition-colors hover:bg-accent/15 hover:border-accent/50 no-underline shrink-0"
        >
          Zobacz wszystkie
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Offer cards */}
      {offers.length > 0 ? (
        <div className="flex flex-col gap-4">
          {offers.map(({ offer, categoryIconUrl }) => (
            <UserOfferCard
              key={offer.id}
              offer={offer}
              categoryIconUrl={categoryIconUrl}
              adminRoute={adminRoute}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--theme-border-color) bg-(--theme-elevation-50) py-12 text-center">
          <LayoutList className="mb-3 h-10 w-10 text-(--theme-elevation-300)" />
          <p className="text-sm text-(--theme-elevation-500)">
            Nie masz jeszcze żadnych ofert.
          </p>
          <Link
            href={`${adminRoute}/collections/offers/create`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-4 py-2 text-sm font-semibold text-accent-foreground dark:text-accent transition-colors hover:bg-accent/15 no-underline"
          >
            Utwórz pierwszą ofertę
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
