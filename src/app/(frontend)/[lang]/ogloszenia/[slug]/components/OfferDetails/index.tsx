import { Offer, OfferUpload, ProfilePicture, User } from '@/payload-types'
import { RichText } from '@/components/payload/RichText'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  Info,
  User as UserIcon,
  Tag,
  Banknote,
  CalendarPlus,
  CalendarClock,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { SpanLikeH3 } from '@/components/frontend/Content/SpanLikeH3'

interface InfoRowProps {
  /** Icon or custom content rendered inside the circle */
  iconContent: React.ReactNode
  label: string
  value: React.ReactNode
  variant?: 'primary' | 'muted'
  /** Extra classes on the value text */
  valueClassName?: string
}

const InfoRow: React.FC<InfoRowProps> = ({
  iconContent,
  label,
  value,
  variant = 'primary',
  valueClassName = 'font-medium text-sm',
}) => {
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
        <p className="text-[11px] sm:text-xs text-muted-foreground">{label}</p>
        <p className={valueClassName}>{value}</p>
      </div>
    </div>
  )
}

interface OfferDetailsProps {
  offer: Offer
  /** Pre-resolved category icon URL (resolved server-side to avoid bundling payload in client) */
  categoryIconUrl?: string | null
}

export const OfferDetails: React.FC<OfferDetailsProps> = ({ offer, categoryIconUrl }) => {
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

  return (
    <section className="mx-auto w-full min-w-0 space-y-6 sm:space-y-8 md:space-y-12">
      {/* Main content - Rich Text */}
      <div className="flex flex-col-reverse lg:flex-row lg:items-start gap-6 sm:gap-8 lg:gap-12 w-full min-w-0 ">
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
                  //   className="prose-lg max-w-none"
                />
              )}
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
                value={
                  offer.hasPriceRange
                    ? `${(offer.priceFrom ?? 0).toLocaleString('pl-PL')} - ${(offer.priceTo ?? 0).toLocaleString('pl-PL')} zł`
                    : `${(offer.price ?? 0).toLocaleString('pl-PL')} zł`
                }
                valueClassName="font-bold text-base sm:text-lg"
              />

              {/* Created at */}
              <InfoRow
                variant="muted"
                iconContent={<CalendarPlus className="size-5 text-muted-foreground" />}
                label="Data dodania"
                value={formatDate(offer.createdAt)}
                valueClassName="text-xs sm:text-sm text-muted-foreground"
              />

              {/* Updated at */}
              <InfoRow
                variant="muted"
                iconContent={<CalendarClock className="size-5 text-muted-foreground" />}
                label="Ostatnia aktualizacja"
                value={formatDate(offer.updatedAt)}
                valueClassName="text-xs sm:text-sm text-muted-foreground"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
