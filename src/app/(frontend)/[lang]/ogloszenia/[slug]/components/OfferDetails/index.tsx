import React from 'react'
import { EventType, Offer, ProfilePicture, User } from '@/payload-types'
import { RichText } from '@/components/payload/RichText'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  Info,
  User as UserIcon,
  Tag,
  PartyPopper,
  Banknote,
  CalendarPlus,
  CalendarClock,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { SpanLikeH3 } from '@/components/frontend/Content/SpanLikeH3'
import { formatOfferPrice } from '@/lib/formatOfferPrice'
import { EventTypeChips } from '../EventTypeChips'

interface InfoRowProps {
  /** Icon or custom content rendered inside the circle */
  iconContent: React.ReactNode
  label: string
  value: React.ReactNode
  variant?: 'primary' | 'muted'
  /** Extra classes on the value text */
  valueClassName?: string
}

const InfoRow = React.memo(function InfoRow({
  iconContent,
  label,
  value,
  variant = 'primary',
  valueClassName = 'font-medium text-lg',
}: InfoRowProps) {
  const isPrimary = variant === 'primary'

  return (
    <div
      className={`flex items-center gap-4 rounded-lg p-2 -mx-2 transition-colors ${isPrimary ? 'hover:bg-primary/5' : 'hover:bg-muted/50'}`}
    >
      <div
        className={`relative size-10 sm:size-11 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${isPrimary ? 'bg-primary/10' : 'bg-muted'}`}
      >
        {iconContent}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={valueClassName}>{value}</p>
      </div>
    </div>
  )
})

interface OfferDetailsProps {
  offer: Offer
  /** Pre-resolved category icon URL (resolved server-side to avoid bundling payload in client) */
  categoryIconUrl?: string | null
  /** All active event types — used to populate the "applies to all" chip row. */
  allEventTypes?: EventType[]
}

export const OfferDetails: React.FC<OfferDetailsProps> = ({
  offer,
  categoryIconUrl,
  allEventTypes = [],
}) => {
  const author = isExpandedDoc<User>(offer.user) ? offer.user : null

  let authorImageUrl: string | null = null
  if (author?.profilePicture && isExpandedDoc<ProfilePicture>(author.profilePicture)) {
    authorImageUrl = author.profilePicture.url || null
  } else if (author?.image) {
    authorImageUrl = author.image
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  // At depth >= 1 these come back as full docs; filter to expanded ones so we
  // can read names. Empty = the offer applies to every event type (the same
  // "empty matches all" fallback the listings filter uses), surfaced here as
  // an explicit "Wszystkie rodzaje" value.
  const eventTypes: EventType[] = Array.isArray(offer.eventTypes)
    ? offer.eventTypes.filter((t): t is EventType => typeof t === 'object' && t !== null)
    : []

  // No specific types selected = the offer applies to every event type, so we
  // show the full active list; otherwise show the offer's own selection.
  const isAllEventTypes = eventTypes.length === 0
  const chipTypes = isAllEventTypes ? allEventTypes : eventTypes

  return (
    <section className="mx-auto w-full min-w-0 space-y-6 sm:space-y-8 md:space-y-12">
      {/* Main content - Rich Text */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-6 sm:gap-8 lg:gap-12 w-full min-w-0 ">
        <div className="w-full min-w-0 lg:w-2/3 lg:sticky lg:top-24">
          <Card className="w-full min-w-0 overflow-hidden bg-primary/5 backdrop-blur-sm border-border/50">
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center font-normal gap-4 sm:gap-6 text-lg sm:text-xl font-montserrat">
                <FileText className="size-6 sm:size-8 text-primary shrink-0" />
                <SpanLikeH3 title="Opis oferty" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              {offer.content && (
                <RichText
                  data={offer.content}
                  enableGutter={false}
                  enableProse
                  className="prose-lg max-w-none"
                />
              )}

              {/* Event types — shown at the end of the description as a flex-wrap
                  of all chips. Empty selection = applies to every type, so we show
                  the full active list; the degenerate empty case falls back to a
                  plain "Wszystkie rodzaje". */}
              <Separator className="mt-6 sm:mt-8" />
              <div className="mt-6 sm:mt-8 flex items-center gap-4 sm:gap-6">
                <PartyPopper className="size-6 sm:size-8 text-primary shrink-0" />
                <SpanLikeH3 title="Rodzaje eventów" />
              </div>
              <div className="mt-4">
                {chipTypes.length > 0 ? (
                  <EventTypeChips types={chipTypes} />
                ) : (
                  <p className="font-medium text-lg text-muted-foreground">Wszystkie rodzaje</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Quick Info */}
        <div className="w-full min-w-0 lg:w-1/3 lg:self-start lg:sticky lg:top-24">
          {/* Quick Info Card */}
          <Card className="w-full min-w-0 overflow-hidden bg-primary/5 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3 border-b ">
              <CardTitle className="flex items-center font-normal gap-4 sm:gap-6 text-lg sm:text-xl font-montserrat">
                <Info className="size-6 sm:size-8 text-primary shrink-0" />
                <SpanLikeH3 title="Informacje" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 space-y-1">
              {/* Author */}
              {author && (
                <InfoRow
                  iconContent={
                    authorImageUrl ? (
                      <Image
                        src={authorImageUrl}
                        alt={author.name || 'Autor'}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    ) : (
                      <UserIcon className="size-5 text-primary" />
                    )
                  }
                  label="Autor"
                  value={author.name}
                />
              )}

              <Separator />

              {/* Category */}
              {offer.categoryName && (
                <InfoRow
                  iconContent={
                    categoryIconUrl ? (
                      <Image
                        src={categoryIconUrl}
                        alt={offer.categoryName}
                        fill
                        className="object-contain p-1.5 sm:p-2 dark:invert"
                        sizes="44px"
                      />
                    ) : (
                      <Tag className="size-5 text-primary" />
                    )
                  }
                  label="Kategoria"
                  value={offer.categoryName}
                />
              )}

              {/* Price */}
              <InfoRow
                iconContent={<Banknote className="size-5 text-primary" />}
                label="Cena"
                value={formatOfferPrice(offer)}
                valueClassName="font-bold text-lg sm:text-xl"
              />

              {/* Created at */}
              <InfoRow
                variant="muted"
                iconContent={<CalendarPlus className="size-5 text-muted-foreground" />}
                label="Data dodania"
                value={formatDate(offer.createdAt)}
                valueClassName="text-muted-foreground"
              />

              {/* Updated at */}
              <InfoRow
                variant="muted"
                iconContent={<CalendarClock className="size-5 text-muted-foreground" />}
                label="Ostatnia aktualizacja"
                value={formatDate(offer.updatedAt)}
                valueClassName="text-muted-foreground"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
