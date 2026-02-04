import { Offer, OfferUpload, User } from '@/payload-types'
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
import { TitleH2 } from '@/components/frontend/Content/TitleH2'
import { TitleH3 } from '@/components/frontend/Content/TitleH3'

interface OfferDetailsProps {
  offer: Offer
}

export const OfferDetails: React.FC<OfferDetailsProps> = ({ offer }) => {
  const mainImage = isExpandedDoc<OfferUpload>(offer.mainImage) ? offer.mainImage : null
  const author = isExpandedDoc<User>(offer.user) ? offer.user : null

  return (
    <section className="mx-auto w-full min-w-0 space-y-6 sm:space-y-8 md:space-y-12">
      {/* Top section - Circle image with short description */}
      <div className="flex flex-col justify-center sm:flex-row items-center gap-6 sm:gap-8 md:gap-12">
        {/* Circle main image */}
        {mainImage && mainImage.url && (
          <div className="relative shrink-0">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-primary/20 shadow-2xl shadow-primary/10">
              <Image
                src={mainImage.url}
                alt={mainImage.title || offer.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 192px"
              />
            </div>
            {/* Decorative ring */}
            <div
              className="absolute -inset-2 rounded-full border-2 border-dashed border-primary/30 animate-spin-slow"
              style={{ animationDuration: '20s' }}
            />
          </div>
        )}

        {/* Short description */}
        {offer.shortDescription && (
          <div className="flex-1 min-w-0 text-center sm:text-left flex flex-col items-center sm:items-start mt-2 gap-4">
            <div className="w-fit">
              <TitleH3 title="W skrócie" />
            </div>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl break-words">
              {offer.shortDescription}
            </p>
          </div>
        )}
      </div>

      {/* Main content - Rich Text */}
      <div className="flex flex-col-reverse lg:flex-row lg:items-start gap-6 sm:gap-8 lg:gap-12 w-full min-w-0 ">
        <div className="w-full min-w-0 lg:w-2/3 lg:sticky lg:top-24">
          <Card className="w-full min-w-0 overflow-hidden bg-primary/5 backdrop-blur-sm border-border/50">
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center font-normal gap-3 sm:gap-4 md:gap-6 text-lg sm:text-xl font-montserrat">
                <FileText className="size-5 sm:size-6 md:size-8 text-primary shrink-0" />
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
              <CardTitle className="flex items-center font-normal gap-3 sm:gap-4 md:gap-6 text-lg sm:text-xl font-montserrat">
                <Info className="size-5 sm:size-6 md:size-8 text-primary shrink-0" />
                <SpanLikeH3 title="Informacje" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 space-y-4 sm:space-y-5">
              {/* Author */}
              {author && (
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-full bg-primary/10">
                    <UserIcon className="size-3.5 sm:size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs text-muted-foreground">Autor</p>
                    <p className="font-medium text-sm">{author.name}</p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Category */}
              {offer.categoryName && (
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-full bg-primary/10">
                    <Tag className="size-3.5 sm:size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs text-muted-foreground">Kategoria</p>
                    <p className="font-medium text-sm">{offer.categoryName}</p>
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-full bg-primary/10">
                  <Banknote className="size-3.5 sm:size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Cena</p>
                  <p className="font-semibold text-sm sm:text-base text-primary">
                    {offer.hasPriceRange
                      ? `${(offer.priceFrom ?? 0).toLocaleString('pl-PL')} - ${(offer.priceTo ?? 0).toLocaleString('pl-PL')} zł`
                      : `${(offer.price ?? 0).toLocaleString('pl-PL')} zł`}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Created at */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-full bg-muted">
                  <CalendarPlus className="size-3.5 sm:size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Data dodania</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {new Date(offer.createdAt).toLocaleDateString('pl-PL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Updated at */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-full bg-muted">
                  <CalendarClock className="size-3.5 sm:size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    Ostatnia aktualizacja
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {new Date(offer.updatedAt).toLocaleDateString('pl-PL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
