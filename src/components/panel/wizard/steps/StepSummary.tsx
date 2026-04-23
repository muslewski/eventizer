'use client'

import { type Control, type FieldErrors, type UseFormGetValues, type UseFormSetValue } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShortDescriptionGenerator } from './ShortDescriptionGenerator'
import { formatOfferPrice } from '@/lib/formatOfferPrice'
import type { OfferFormData } from '@/components/panel/wizard/offerSchema'

interface StepSummaryProps {
  control: Control<OfferFormData>
  errors: FieldErrors<OfferFormData>
  getValues: UseFormGetValues<OfferFormData>
  setValue: UseFormSetValue<OfferFormData>
  content: any
  mainImageId: number | null
  galleryIds: number[]
  videoId: number | null
}

export function StepSummary({
  control,
  errors,
  getValues,
  setValue,
  content,
  mainImageId,
  galleryIds,
  videoId,
}: StepSummaryProps) {
  const values = getValues()

  const priceDisplay = formatOfferPrice({
    hasPriceRange: values.hasPriceRange,
    price: values.price,
    priceFrom: values.priceFrom,
    priceTo: values.priceTo,
  })

  return (
    <div className="flex flex-col gap-6">
      {/* AI-powered short description */}
      <ShortDescriptionGenerator
        control={control}
        errors={errors}
        title={values.title}
        category={values.category}
        price={priceDisplay}
        address={values.address}
        content={content}
        onGenerated={(text) => setValue('shortDescription', text)}
      />

      <Separator />

      {/* Review summary */}
      <div className="flex flex-col gap-3">
        <h3 className="font-bebas text-lg tracking-wide text-muted-foreground">Podsumowanie oferty</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="bg-background border-border/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Podstawowe</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tytuł</span>
                <span className="font-medium truncate ml-4">{values.title || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kategoria</span>
                <span className="font-medium truncate ml-4">{values.category || '-'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background border-border/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cena i lokalizacja</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cena</span>
                <span className="font-medium">{priceDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Adres</span>
                <span className="font-medium truncate ml-4">{values.address || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zasięg</span>
                <span className="font-medium">{values.serviceRadius} km</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background border-border/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Media</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zdjęcie główne</span>
                <Badge variant={mainImageId ? 'default' : 'secondary'}>
                  {mainImageId ? 'Dodane' : 'Brak'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Galeria</span>
                <span className="font-medium">
                  {galleryIds.length > 0 ? `${galleryIds.length} zdjęć` : 'Brak'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Film</span>
                <Badge variant={videoId ? 'default' : 'secondary'}>
                  {videoId ? 'Dodany' : 'Brak'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background border-border/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Treść i kontakt</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Treść oferty</span>
                <Badge variant={content ? 'default' : 'secondary'}>
                  {content ? 'Dodana' : 'Brak'}
                </Badge>
              </div>
              {values.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefon</span>
                  <span className="font-medium">{values.phone}</span>
                </div>
              )}
              {values.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium truncate ml-4">{values.email}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
