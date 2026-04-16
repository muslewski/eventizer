'use client'

import { Controller, type Control, type FieldErrors, type UseFormGetValues } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import type { OfferFormData } from '@/components/panel/wizard/offerSchema'

interface StepSummaryProps {
  control: Control<OfferFormData>
  errors: FieldErrors<OfferFormData>
  getValues: UseFormGetValues<OfferFormData>
  content: any
  mainImageId: number | null
  galleryIds: number[]
  videoId: number | null
}

export function StepSummary({
  control,
  errors,
  getValues,
  content,
  mainImageId,
  galleryIds,
  videoId,
}: StepSummaryProps) {
  const values = getValues()

  return (
    <div className="flex flex-col gap-6">
      {/* Short description — editable in finalization step */}
      <FieldGroup>
        <Field data-invalid={!!errors.shortDescription}>
          <FieldLabel htmlFor="shortDescription">Krótki opis oferty</FieldLabel>
          <FieldDescription>
            Podsumowanie widoczne na listach wyników i w kartach ofert. Zachęć potencjalnych klientów do kliknięcia.
          </FieldDescription>
          <Controller
            name="shortDescription"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col gap-1">
                <Textarea
                  id="shortDescription"
                  placeholder="Opisz krótko swoją ofertę — co wyróżnia Cię na tle konkurencji?"
                  rows={3}
                  {...field}
                  aria-invalid={!!errors.shortDescription}
                />
                <div className="flex items-center justify-between">
                  <FieldError>{errors.shortDescription?.message}</FieldError>
                  <span className="text-xs text-muted-foreground">
                    {field.value?.length || 0}/500
                  </span>
                </div>
              </div>
            )}
          />
        </Field>
      </FieldGroup>

      <Separator />

      {/* Review summary */}
      <div className="flex flex-col gap-3">
        <h3 className="font-bebas text-lg tracking-wide text-muted-foreground">Podsumowanie oferty</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Basic info */}
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

          {/* Pricing & Location */}
          <Card className="bg-background border-border/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cena i lokalizacja</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cena</span>
                <span className="font-medium">
                  {values.hasPriceRange
                    ? `${values.priceFrom ?? '-'} – ${values.priceTo ?? '-'} PLN`
                    : `${values.price ?? '-'} PLN`}
                </span>
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

          {/* Media */}
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

          {/* Content & Contact */}
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
